CREATE OR REPLACE FUNCTION public.has_admin_users()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
    LIMIT 1
  );
$$;
