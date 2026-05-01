
-- 1. Fix privilege escalation: only allow self-assignment of 'member' role (or remove if not in enum). 
-- Restrict to non-privileged roles only. Allowed self-assign roles: 'startup_founder' (founders are not privileged for opportunity creation).
-- Drop old permissive insert policy
DROP POLICY IF EXISTS "Users can insert non-admin roles only" ON public.user_roles;

-- Only allow self-assignment of the 'startup_founder' role (the basic onboarding role).
-- Privileged roles (admin, investor, ecosystem_partner, mentor) must be assigned by an admin.
CREATE POLICY "Users can self-assign founder role only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'startup_founder'::app_role
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
);

-- 2. Restrict viewing of user_roles - users should only see their own roles, admins see all
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove the public "Anyone in group can view likes" policy on group_post_likes
DROP POLICY IF EXISTS "Anyone in group can view likes" ON public.group_post_likes;

-- 4. Remove sensitive table 'profiles' from realtime publication to prevent broadcast leakage
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 5. Add RLS policies on realtime.messages to scope channel subscription access
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only receive broadcasts on topics they are authorized for.
-- We restrict to user-scoped topics: topic must equal auth.uid() or start with auth.uid()::text || ':'
CREATE POLICY "Authenticated can subscribe to own user topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = (SELECT auth.uid())::text)
  OR (realtime.topic() LIKE (SELECT auth.uid())::text || ':%')
);
