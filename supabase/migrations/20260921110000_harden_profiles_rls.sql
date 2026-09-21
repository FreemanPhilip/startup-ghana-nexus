-- Harden profiles RLS: stop leaking sensitive per-user columns.
--
-- The "Authenticated users can view basic profiles" policy intentionally lets
-- any signed-in user read other users' profiles (mentor/investor listings).
-- Row-level policy cannot hide columns, so those callers could also read
-- phone numbers, funding asks, membership tier, admin level, and the Talent
-- identity link of every user. Restrict those columns on the base table and
-- route full-row reads through two SECURITY DEFINER RPCs that enforce the
-- caller's own identity / admin role.

-- 1. Column-level protection ------------------------------------------------
-- SELECT only; UPDATE/INSERT privileges are untouched so owners can still edit
-- their own rows (the UPDATE policy gates on auth.uid()).
REVOKE SELECT (phone,
               funding_required,
               investment_focus,
               investment_range,
               portfolio_size,
               membership,
               admin_level,
               talent_user_id)
ON public.profiles
FROM anon, authenticated;

-- 2. Full-row reads must go through these RPCs ------------------------------
-- Own profile: whatever own row you can see via the "Users can view own full
-- profile" policy, returned with the restricted columns included.
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.profiles
  WHERE user_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

-- Admin directory: full rows (incl. admin_level, membership) for admins only.
CREATE OR REPLACE FUNCTION public.get_admin_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_profiles() TO authenticated;

-- 3. Close the get_admin_level leak ----------------------------------------
-- SECURITY DEFINER bypasses the new column grants, so it would hand out
-- admin_level for arbitrary users. Only the user themselves or an admin may
-- read a level now.
CREATE OR REPLACE FUNCTION public.get_admin_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.admin_level
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND (
      auth.uid() = _user_id
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
$$;