-- SparkX Talent SSO bridge
--
-- sparkxglobal and sparkxtalent are separate Supabase projects, so they do not
-- share auth.users. The talent-login edge function verifies credentials against
-- the Talent project and then provisions/links a local user here. This migration
-- adds the supporting schema.

-- 1. Link a local profile back to its Talent identity -------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS talent_user_id uuid;

COMMENT ON COLUMN public.profiles.talent_user_id IS
  'The user''s id in the sparkxtalent Supabase project, set when they sign in via the Talent SSO bridge.';

-- One Talent identity maps to at most one local profile.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_talent_user_id_key
  ON public.profiles (talent_user_id)
  WHERE talent_user_id IS NOT NULL;

-- 2. Carry talent_user_id through signup --------------------------------------
-- Unchanged behaviour for normal signups; the new column is simply NULL there.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, talent_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'talent_user_id', '')::uuid
  );

  IF NEW.raw_user_meta_data ->> 'primary_role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'primary_role')::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- CREATE OR REPLACE preserves existing grants, so the revoke applied in
-- 20260711113100 still holds. Re-asserted here so this migration cannot widen
-- access to a SECURITY DEFINER function even if replayed out of order.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. Rate-limit the bridge ----------------------------------------------------
-- The bridge forwards credentials to the Talent project, so without a limit it
-- could be used to brute-force Talent accounts. Only the service role touches
-- this table.
CREATE TABLE IF NOT EXISTS public.talent_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS talent_login_attempts_email_created_idx
  ON public.talent_login_attempts (email, created_at DESC);

ALTER TABLE public.talent_login_attempts ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies: this table is service-role only and must never be
-- readable by anon/authenticated clients.
REVOKE ALL ON public.talent_login_attempts FROM anon, authenticated;
GRANT ALL ON public.talent_login_attempts TO service_role;
