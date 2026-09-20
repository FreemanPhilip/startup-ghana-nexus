// Sign in to sparkxglobal using a sparkxtalent (talent.sparkxglobal.net) account.
//
// sparkxglobal and sparkxtalent are separate Supabase projects in the same
// organisation, so they do NOT share auth.users. This function bridges them:
//
//   1. Verify the submitted credentials against the Talent project's auth API.
//   2. Provision (or find) the matching user in this project, keyed by email.
//   3. Mint a short-lived magic-link token and hand it back so the browser can
//      exchange it for a real session via supabase.auth.verifyOtp().
//
// The password is only ever forwarded to the Talent auth endpoint. It is never
// stored, never logged, and never persisted in this project.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credential-stuffing guard. The bridge proxies credential checks to another
// project, so it must not be an unlimited oracle.
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const ATTEMPT_RETENTION_HOURS = 24;

// Deliberately vague: never reveal whether an email exists on Talent.
const GENERIC_AUTH_ERROR =
  "Those SparkX Talent details didn't work. Check your email and password and try again.";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const talentUrl = Deno.env.get("TALENT_SUPABASE_URL");
  const talentAnonKey = Deno.env.get("TALENT_SUPABASE_ANON_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!talentUrl || !talentAnonKey) {
    console.error("talent-login: TALENT_SUPABASE_URL / TALENT_SUPABASE_ANON_KEY are not configured");
    return json({ error: "SparkX Talent sign-in is not configured yet." }, 503);
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("talent-login: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Sign-in is temporarily unavailable." }, 503);
  }

  let email: string;
  let password: string;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (!email || !password) {
    return json({ error: "Email and password are required." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- 1. Rate limit -------------------------------------------------------
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const { count: recentAttempts, error: rateError } = await admin
    .from("talent_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("succeeded", false)
    .gte("created_at", windowStart);

  if (rateError) {
    // Fail closed: if the guard is broken we do not proxy credentials onward.
    console.error("talent-login: rate limit check failed", rateError.message);
    return json({ error: "Sign-in is temporarily unavailable." }, 503);
  }

  if ((recentAttempts ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    return json(
      { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
      429,
    );
  }

  const recordAttempt = async (succeeded: boolean) => {
    const { error } = await admin.from("talent_login_attempts").insert({ email, succeeded });
    if (error) console.error("talent-login: could not record attempt", error.message);
  };

  // --- 2. Verify the credentials against the Talent project ----------------
  let talentUser: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null =
    null;
  try {
    const talentResponse = await fetch(`${talentUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: talentAnonKey,
        Authorization: `Bearer ${talentAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!talentResponse.ok) {
      await recordAttempt(false);
      // Do not echo Talent's message through — it can disclose account state.
      return json({ error: GENERIC_AUTH_ERROR }, 401);
    }

    const talentSession = await talentResponse.json();
    talentUser = talentSession?.user ?? null;
  } catch (err) {
    console.error("talent-login: could not reach the Talent project", String(err));
    return json({ error: "Couldn't reach SparkX Talent right now. Please try again." }, 502);
  }

  if (!talentUser?.id || !talentUser?.email) {
    console.error("talent-login: Talent returned a session without a usable user");
    return json({ error: GENERIC_AUTH_ERROR }, 401);
  }

  // Credentials are valid from here on.
  const talentMeta = talentUser.user_metadata ?? {};
  const fullName =
    (typeof talentMeta.full_name === "string" && talentMeta.full_name) ||
    (typeof talentMeta.name === "string" && talentMeta.name) ||
    "";
  const avatarUrl =
    (typeof talentMeta.avatar_url === "string" && talentMeta.avatar_url) ||
    (typeof talentMeta.picture === "string" && talentMeta.picture) ||
    "";

  // --- 3. Provision the matching local user --------------------------------
  // Accounts are matched by email: if someone already signed up here directly,
  // signing in with Talent links to that same account rather than duplicating.
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      avatar_url: avatarUrl,
      talent_user_id: talentUser.id,
    },
  });

  // "already registered" is the expected path for returning users.
  const alreadyRegistered =
    createError && /already|exists|registered/i.test(createError.message ?? "");
  if (createError && !alreadyRegistered) {
    console.error("talent-login: could not create local user", createError.message);
    await recordAttempt(false);
    return json({ error: "Could not set up your account. Please try again." }, 500);
  }

  // --- 4. Mint a session ----------------------------------------------------
  // generateLink does not send an email; it returns a token hash the browser
  // exchanges for a session.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("talent-login: could not generate session", linkError?.message);
    await recordAttempt(false);
    return json({ error: "Could not complete sign-in. Please try again." }, 500);
  }

  // --- 5. Backfill the profile ---------------------------------------------
  // handle_new_user covers users created just now. This also repairs accounts
  // that predate the trigger or were created without a profile row, and stamps
  // talent_user_id onto accounts that originally signed up here directly.
  const linkedUserId = linkData.user?.id;
  if (linkedUserId) {
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: linkedUserId,
          full_name: fullName,
          avatar_url: avatarUrl,
          talent_user_id: talentUser.id,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    if (profileError) {
      // Non-fatal: the user can still sign in and complete onboarding.
      console.error("talent-login: profile backfill failed", profileError.message);
    }
  }

  await recordAttempt(true);

  // Opportunistic cleanup so the guard table stays small.
  const retentionCutoff = new Date(Date.now() - ATTEMPT_RETENTION_HOURS * 3_600_000).toISOString();
  await admin.from("talent_login_attempts").delete().lt("created_at", retentionCutoff);

  return json({
    token_hash: linkData.properties.hashed_token,
    email,
  });
});
