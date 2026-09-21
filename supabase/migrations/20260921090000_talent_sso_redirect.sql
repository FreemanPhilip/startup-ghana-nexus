-- SparkX Talent SSO: move from the password bridge to a redirect hand-off.
--
-- The earlier talent-login function accepted the user's Talent password and
-- forwarded it to the Talent project. That is replaced by a redirect flow:
-- Talent authenticates the user itself and issues a short-lived signed
-- assertion, so this project never sees a Talent password.
--
-- profiles.talent_user_id (added in 20260920120000) is unchanged and still
-- records the linked Talent identity.

-- 1. The password bridge's rate-limit table is no longer used ---------------
-- Nothing else reads it; the redirect flow needs replay protection instead.
DROP TABLE IF EXISTS public.talent_login_attempts;

-- 2. Single-use assertions ---------------------------------------------------
-- Each assertion carries a jti. Recording it on redemption means a leaked or
-- replayed assertion (e.g. one captured from browser history) cannot be used
-- a second time inside its short validity window.
CREATE TABLE IF NOT EXISTS public.talent_sso_used_tokens (
  jti uuid PRIMARY KEY,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  -- The assertion's own exp, so spent entries can be pruned once they could
  -- no longer have been accepted anyway.
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS talent_sso_used_tokens_expires_at_idx
  ON public.talent_sso_used_tokens (expires_at);

ALTER TABLE public.talent_sso_used_tokens ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies: service-role only, never readable by clients.
REVOKE ALL ON public.talent_sso_used_tokens FROM anon, authenticated;
GRANT ALL ON public.talent_sso_used_tokens TO service_role;
