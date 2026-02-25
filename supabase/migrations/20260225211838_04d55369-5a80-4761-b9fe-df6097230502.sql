
-- Create a security definer function to check group membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Create a security definer function to check if user is group creator
CREATE OR REPLACE FUNCTION public.is_group_creator(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND created_by = _user_id
  )
$$;

-- Create a security definer function to check if group is public
CREATE OR REPLACE FUNCTION public.is_group_public(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND (is_private IS NOT TRUE)
  )
$$;

-- Fix groups SELECT policy using security definer
DROP POLICY IF EXISTS "Anyone can view public groups" ON public.groups;
CREATE POLICY "Anyone can view public groups"
ON public.groups FOR SELECT
USING (
  (is_private IS NOT TRUE)
  OR is_group_member(auth.uid(), id)
);

-- Fix group_members SELECT
DROP POLICY IF EXISTS "Members visible to group members" ON public.group_members;
CREATE POLICY "Members visible to group members"
ON public.group_members FOR SELECT
USING (
  is_group_public(group_id)
  OR auth.uid() = user_id
  OR is_group_creator(auth.uid(), group_id)
  OR is_group_member(auth.uid(), group_id)
);

-- Fix group_members UPDATE
DROP POLICY IF EXISTS "Admins can update member roles" ON public.group_members;
CREATE POLICY "Admins can update member roles"
ON public.group_members FOR UPDATE
USING (is_group_creator(auth.uid(), group_id));

-- Fix group_members DELETE
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id
  OR is_group_creator(auth.uid(), group_id)
);

-- Fix group_posts SELECT
DROP POLICY IF EXISTS "Group members can view posts" ON public.group_posts;
CREATE POLICY "Group members can view posts"
ON public.group_posts FOR SELECT
USING (
  is_group_public(group_id)
  OR is_group_member(auth.uid(), group_id)
);

-- Fix group_posts INSERT
DROP POLICY IF EXISTS "Group members can create posts" ON public.group_posts;
CREATE POLICY "Group members can create posts"
ON public.group_posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND is_group_member(auth.uid(), group_id)
);

-- Fix group_events SELECT
DROP POLICY IF EXISTS "Group members can view events" ON public.group_events;
CREATE POLICY "Group members can view events"
ON public.group_events FOR SELECT
USING (
  is_group_public(group_id)
  OR is_group_member(auth.uid(), group_id)
);

-- Fix group_events INSERT
DROP POLICY IF EXISTS "Admins can create events" ON public.group_events;
CREATE POLICY "Admins can create events"
ON public.group_events FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND is_group_creator(auth.uid(), group_id)
);

-- Fix group_events UPDATE
DROP POLICY IF EXISTS "Admins can update events" ON public.group_events;
CREATE POLICY "Admins can update events"
ON public.group_events FOR UPDATE
USING (is_group_creator(auth.uid(), group_id));

-- Fix group_events DELETE
DROP POLICY IF EXISTS "Admins can delete events" ON public.group_events;
CREATE POLICY "Admins can delete events"
ON public.group_events FOR DELETE
USING (is_group_creator(auth.uid(), group_id));

-- Fix group_invitations INSERT
DROP POLICY IF EXISTS "Admins can invite" ON public.group_invitations;
CREATE POLICY "Admins can invite"
ON public.group_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by
  AND is_group_creator(auth.uid(), group_id)
);

-- Fix group_invitations DELETE
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.group_invitations;
CREATE POLICY "Admins can delete invitations"
ON public.group_invitations FOR DELETE
USING (is_group_creator(auth.uid(), group_id));

-- Fix group_invitations SELECT
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.group_invitations;
CREATE POLICY "Users can view relevant invitations"
ON public.group_invitations FOR SELECT
USING (
  auth.uid() = invited_user_id
  OR is_group_creator(auth.uid(), group_id)
);

-- Fix group_join_requests UPDATE
DROP POLICY IF EXISTS "Admins can update requests" ON public.group_join_requests;
CREATE POLICY "Admins can update requests"
ON public.group_join_requests FOR UPDATE
USING (is_group_creator(auth.uid(), group_id));

-- Fix group_join_requests SELECT
DROP POLICY IF EXISTS "Users can view own requests" ON public.group_join_requests;
CREATE POLICY "Users can view own requests"
ON public.group_join_requests FOR SELECT
USING (
  auth.uid() = user_id
  OR is_group_creator(auth.uid(), group_id)
);
