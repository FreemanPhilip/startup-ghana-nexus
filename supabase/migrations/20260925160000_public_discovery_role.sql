-- Expose discovery roles on public_profiles, so the directory can be browsed
-- by who people are.
--
-- Why this is needed: user_roles is readable only by its owner (and admins),
-- which is correct — but it means no client can ask "show me the founders".
-- Browsing was therefore hardcoded to mentors and approximated them as
-- "anyone who filled in availability", so a mentor looking for mentees was
-- shown a list of other mentors.
--
-- An array rather than one role: people hold more than one. Someone who is
-- both a founder and a mentor must be findable as either, and collapsing them
-- to a single "primary" role would quietly hide them from half the platform.
--
-- What is exposed: the non-admin roles, and never 'admin'. Being a founder,
-- mentor, investor or partner is the point of a public directory; being an
-- administrator is not, and must not become inferable from it.

-- Dropped and recreated rather than CREATE OR REPLACE: that cannot add or
-- rename a view's columns, and the view has to go first anyway because the
-- function below is one of its dependencies.
DROP VIEW IF EXISTS public.public_profiles;
DROP FUNCTION IF EXISTS public.public_discovery_role(uuid);

-- SECURITY DEFINER because the whole point is to read past user_roles' RLS.
-- It returns non-admin roles and nothing else, so it cannot be used to
-- enumerate privileges.
CREATE OR REPLACE FUNCTION public.public_discovery_roles(_user_id uuid)
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(ur.role ORDER BY ur.role), ARRAY[]::public.app_role[])
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.role <> 'admin'::public.app_role
$$;

REVOKE ALL ON FUNCTION public.public_discovery_roles(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.public_discovery_roles(uuid) TO authenticated, anon;

-- Keeps security_invoker: profile rows stay subject to the caller's own RLS.
-- Only the role lookup is elevated, and only through the function above.
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.headline,
  p.location,
  p.website_url,
  p.linkedin_url,
  p.industry,
  p.company_name,
  p.company_stage,
  p.expertise,
  p.availability,
  p.years_experience,
  p.verification,
  p.onboarding_step,
  p.created_at,
  public.public_discovery_roles(p.user_id) AS roles
FROM public.profiles p;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- The function runs per row on a browse query; make its lookup an index hit.
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
