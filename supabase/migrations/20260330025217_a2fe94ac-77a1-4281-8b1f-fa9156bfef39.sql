
-- Add admin_level to profiles to track admin tier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_level text DEFAULT NULL;

-- Create a helper function to get admin level
CREATE OR REPLACE FUNCTION public.get_admin_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.admin_level
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- Set existing admin (freemanphilip12@gmail.com) as super_admin
UPDATE public.profiles 
SET admin_level = 'super_admin' 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
) AND admin_level IS NULL;
