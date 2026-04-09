
-- Fix the security definer view issue
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio,
  headline,
  location,
  website_url,
  linkedin_url,
  industry,
  company_name,
  company_stage,
  expertise,
  availability,
  years_experience,
  verification,
  onboarding_step,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
