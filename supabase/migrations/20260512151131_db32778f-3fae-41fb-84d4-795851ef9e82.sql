DROP POLICY IF EXISTS "Users can self-assign founder role only" ON public.user_roles;

CREATE POLICY "Users can self-assign primary role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('startup_founder'::app_role, 'investor'::app_role, 'mentor'::app_role, 'ecosystem_partner'::app_role)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);