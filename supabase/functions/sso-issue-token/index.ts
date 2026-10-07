// Supabase Edge Function: sso-issue-token
//
// Issues a short-lived, signed assertion that lets a SparkX Index account sign
// in to SparkX Talent. The two apps are separate Supabase projects and do not
// share auth.users, so Talent cannot verify an Index password or session on
// its own.
//
// This is the mirror of the same function on the sparkxtalent project, which
// runs the hand-off in the other direction. Between them a member signed in to
// either platform can reach the other without signing in again.
//
// Flow (the caller is the /sso/authorize page in this app):
//   1. The user is already signed in here; the browser sends their access token.
//   2. This function verifies that token against THIS project.
//   3. It checks the requested redirect_uri against a strict allowlist.
//   4. It returns a ~2 minute HS256 JWT naming the user, which Talent verifies
//      with the same shared secret before provisioning a local session.
//
// The user's password never leaves this project. The assertion is single-use:
// it carries a jti that Talent records and refuses to replay.
//
// Secrets (set once, on the sparkxglobal project):
//   supabase secrets set SPARKX_SSO_SHARED_SECRET="<the same value both projects use>"
//   supabase secrets set SPARKX_SSO_ALLOWED_REDIRECTS="https://talent.sparkxglobal.net/auth/sparkx-index/callback"
// SPARKX_SSO_ALLOWED_REDIRECTS is a comma-separated list of EXACT URLs.
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the runtime.)
//
// Deploy (JWT required — only a signed-in user may mint an assertion):
//   supabase functions deploy sso-issue-token

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keep the window tight: the assertion is redeemed immediately after redirect.
const TOKEN_TTL_SECONDS = 120;
const ISSUER = "sparkxglobal";
const AUDIENCE = "sparkxtalent";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signHs256(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput)),
  );
  return `${signingInput}.${b64url(sig)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const sharedSecret = Deno.env.get("SPARKX_SSO_SHARED_SECRET");
  const allowedRedirects = (Deno.env.get("SPARKX_SSO_ALLOWED_REDIRECTS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!sharedSecret || allowedRedirects.length === 0) {
    console.error(
      "sso-issue-token: SPARKX_SSO_SHARED_SECRET / SPARKX_SSO_ALLOWED_REDIRECTS not set",
    );
    return json({ error: "SparkX Talent sign-in is not configured yet." }, 503);
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("sso-issue-token: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Sign-in is temporarily unavailable." }, 503);
  }

  // --- Who is asking? ------------------------------------------------------
  const authHeader = req.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return json({ error: "Not signed in." }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  const user = userData?.user;
  if (userError || !user?.id || !user.email) {
    return json({ error: "Not signed in." }, 401);
  }

  // --- Where are we sending them? -----------------------------------------
  let redirectUri = "";
  try {
    const body = await req.json();
    redirectUri = typeof body?.redirect_uri === "string" ? body.redirect_uri.trim() : "";
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // Exact match only. A prefix or hostname check would let a crafted
  // redirect_uri carry the assertion off to somewhere we don't control.
  //
  // Note this is exact: apex and www are DIFFERENT entries. SparkX Talent
  // sends whichever origin the visitor is actually on, so every host that
  // serves it needs its own entry in SPARKX_SSO_ALLOWED_REDIRECTS.
  if (!redirectUri || !allowedRedirects.includes(redirectUri)) {
    // Log the allowlist alongside the rejected value so the mismatch is
    // obvious from the function logs without guesswork.
    console.error(
      "sso-issue-token: rejected redirect_uri",
      JSON.stringify({ received: redirectUri, allowed: allowedRedirects }),
    );
    // Echo the rejected value back. The caller supplied it, so this reveals
    // nothing it does not already know, and it turns an opaque dead end into
    // a message that names exactly what has to be allowlisted.
    return json(
      {
        error: redirectUri
          ? `That sign-in destination is not allowed: ${redirectUri}. Add it to SPARKX_SSO_ALLOWED_REDIRECTS on the sparkxglobal project.`
          : "No sign-in destination was supplied.",
        received_redirect_uri: redirectUri || null,
      },
      400,
    );
  }

  // --- Mint the assertion --------------------------------------------------
  const now = Math.floor(Date.now() / 1000);
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    "";

  const token = await signHs256(
    {
      iss: ISSUER,
      aud: AUDIENCE,
      sub: user.id,
      email: user.email,
      name: fullName,
      avatar_url: avatarUrl,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      jti: crypto.randomUUID(),
    },
    sharedSecret,
  );

  return json({ token, expires_in: TOKEN_TTL_SECONDS });
});
