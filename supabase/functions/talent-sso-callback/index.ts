// Redeem a SparkX Talent SSO assertion for a session in this project.
//
// sparkxglobal and sparkxtalent are separate Supabase projects and do not share
// auth.users. The Talent app authenticates the user itself and issues a short
// HS256 assertion (its sso-issue-token function). This function verifies that
// assertion and provisions/links the matching local user.
//
// This project never sees the user's Talent password.
//
// Checks performed before any account is touched:
//   - signature (HS256, shared secret, byte-identical on both projects)
//   - iss / aud
//   - exp, and a sanity bound on iat to reject absurdly long-lived assertions
//   - jti not already redeemed (single use)
//
// Secrets (set once):
//   supabase secrets set SPARKX_SSO_SHARED_SECRET="<same value as on sparkxtalent>"
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the runtime.)
//
// Deploy (public — the caller is signed out by definition):
//   supabase functions deploy talent-sso-callback --no-verify-jwt

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXPECTED_ISSUER = "sparkxtalent";
const EXPECTED_AUDIENCE = "sparkxglobal";
// The issuer mints 120s assertions. Allow a little clock skew, but refuse
// anything claiming a long life even if correctly signed.
const MAX_LIFETIME_SECONDS = 600;
const CLOCK_SKEW_SECONDS = 60;

const GENERIC_ERROR = "That SparkX Talent sign-in link is invalid or has expired. Please try again.";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function b64urlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    "=",
  );
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Verify an HS256 JWT and return its payload, or null if anything is off. */
async function verifyHs256(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  let header: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(headerB64)));
  } catch {
    return null;
  }
  // Pin the algorithm — never take it from the token.
  if (header.alg !== "HS256") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  let ok = false;
  try {
    ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
  } catch {
    return null;
  }
  if (!ok) return null;

  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const sharedSecret = Deno.env.get("SPARKX_SSO_SHARED_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!sharedSecret) {
    console.error("talent-sso-callback: SPARKX_SSO_SHARED_SECRET is not configured");
    return json({ error: "SparkX Talent sign-in is not configured yet." }, 503);
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("talent-sso-callback: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Sign-in is temporarily unavailable." }, 503);
  }

  let token = "";
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token.trim() : "";
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!token) return json({ error: GENERIC_ERROR }, 400);

  // --- 1. Verify the assertion ---------------------------------------------
  const payload = await verifyHs256(token, sharedSecret);
  if (!payload) return json({ error: GENERIC_ERROR }, 401);

  const now = Math.floor(Date.now() / 1000);
  const { iss, aud, sub, email, exp, iat, jti } = payload as {
    iss?: string;
    aud?: string;
    sub?: string;
    email?: string;
    exp?: number;
    iat?: number;
    jti?: string;
  };

  if (iss !== EXPECTED_ISSUER || aud !== EXPECTED_AUDIENCE) return json({ error: GENERIC_ERROR }, 401);
  if (typeof exp !== "number" || exp + CLOCK_SKEW_SECONDS < now) return json({ error: GENERIC_ERROR }, 401);
  if (typeof iat !== "number" || iat - CLOCK_SKEW_SECONDS > now) return json({ error: GENERIC_ERROR }, 401);
  if (exp - iat > MAX_LIFETIME_SECONDS) return json({ error: GENERIC_ERROR }, 401);
  if (!sub || !email || !jti) return json({ error: GENERIC_ERROR }, 401);

  const normalisedEmail = email.trim().toLowerCase();
  const name = typeof payload.name === "string" ? payload.name : "";
  const avatarUrl = typeof payload.avatar_url === "string" ? payload.avatar_url : "";

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- 2. Single use --------------------------------------------------------
  // The PK insert is the guard: a replay loses the race and is rejected here
  // rather than relying on a read-then-write check.
  const { error: replayError } = await admin.from("talent_sso_used_tokens").insert({
    jti,
    expires_at: new Date(exp * 1000).toISOString(),
  });
  if (replayError) {
    // 23505 = unique violation, i.e. this assertion was already redeemed.
    console.error("talent-sso-callback: assertion rejected", replayError.code ?? replayError.message);
    return json({ error: GENERIC_ERROR }, 401);
  }

  // --- 3. Provision / link the local user -----------------------------------
  // Matched by email, so someone who already signed up here directly is linked
  // rather than duplicated.
  const { error: createError } = await admin.auth.admin.createUser({
    email: normalisedEmail,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      avatar_url: avatarUrl,
      talent_user_id: sub,
    },
  });

  const alreadyRegistered =
    createError && /already|exists|registered/i.test(createError.message ?? "");
  if (createError && !alreadyRegistered) {
    console.error("talent-sso-callback: could not create local user", createError.message);
    return json({ error: "Could not set up your account. Please try again." }, 500);
  }

  // --- 4. Mint a session ----------------------------------------------------
  // generateLink does not send an email; it returns a token hash the browser
  // exchanges for a session via verifyOtp.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalisedEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("talent-sso-callback: could not generate session", linkError?.message);
    return json({ error: "Could not complete sign-in. Please try again." }, 500);
  }

  // --- 5. Backfill the profile ---------------------------------------------
  // handle_new_user covers users created just now. This also repairs accounts
  // with no profile row and stamps talent_user_id onto accounts that originally
  // signed up here directly.
  const linkedUserId = linkData.user?.id;
  if (linkedUserId) {
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        user_id: linkedUserId,
        full_name: name,
        avatar_url: avatarUrl,
        talent_user_id: sub,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (profileError) {
      // Non-fatal: the user can still sign in and finish onboarding.
      console.error("talent-sso-callback: profile backfill failed", profileError.message);
    }
  }

  // Prune spent assertions that can no longer be valid under any clock skew.
  const pruneCutoff = new Date(Date.now() - MAX_LIFETIME_SECONDS * 1000).toISOString();
  await admin.from("talent_sso_used_tokens").delete().lt("expires_at", pruneCutoff);

  return json({ token_hash: linkData.properties.hashed_token, email: normalisedEmail });
});
