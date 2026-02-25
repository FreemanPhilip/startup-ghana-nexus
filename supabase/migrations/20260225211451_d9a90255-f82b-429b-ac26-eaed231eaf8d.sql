
-- Fix 1: Restrict opportunity creation to investors, admins, ecosystem partners only
DROP POLICY IF EXISTS "Authenticated users can create opportunities" ON public.opportunities;
CREATE POLICY "Investors admins partners can create opportunities"
ON public.opportunities FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    has_role(auth.uid(), 'investor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'ecosystem_partner'::app_role)
  )
);

-- Fix 2: Fix infinite recursion in group_members policies
-- The SELECT policy on group_members references group_members itself causing recursion
-- The groups SELECT policy also has a bug: gm.group_id = gm.id should be gm.group_id = groups.id

-- Fix groups SELECT policy (had gm.group_id = gm.id instead of gm.group_id = groups.id)
DROP POLICY IF EXISTS "Anyone can view public groups" ON public.groups;
CREATE POLICY "Anyone can view public groups"
ON public.groups FOR SELECT
USING (
  (is_private IS NOT TRUE)
  OR (EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  ))
);

-- Fix group_members SELECT - avoid self-referencing by checking group privacy directly
DROP POLICY IF EXISTS "Members visible to group members" ON public.group_members;
CREATE POLICY "Members visible to group members"
ON public.group_members FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id AND (g.is_private IS NOT TRUE)
  ))
  OR (auth.uid() = user_id)
  OR (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  ))
);

-- Fix group_members UPDATE - avoid self-referencing
DROP POLICY IF EXISTS "Admins can update member roles" ON public.group_members;
CREATE POLICY "Admins can update member roles"
ON public.group_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
);

-- Fix group_members DELETE - avoid self-referencing
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (
  (auth.uid() = user_id)
  OR (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  ))
);

-- Fix group_posts INSERT policy - avoid referencing group_members with recursion
DROP POLICY IF EXISTS "Group members can create posts" ON public.group_posts;
CREATE POLICY "Group members can create posts"
ON public.group_posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid()
  )
);

-- Fix group_posts SELECT policy
DROP POLICY IF EXISTS "Group members can view posts" ON public.group_posts;
CREATE POLICY "Group members can view posts"
ON public.group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_posts.group_id AND (g.is_private IS NOT TRUE)
  )
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid()
  )
);

-- Fix group_events policies that reference group_members
DROP POLICY IF EXISTS "Group members can view events" ON public.group_events;
CREATE POLICY "Group members can view events"
ON public.group_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_events.group_id AND (g.is_private IS NOT TRUE)
  )
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid()
  )
);

-- Fix group_events admin policies to use groups.created_by instead of recursive group_members check
DROP POLICY IF EXISTS "Admins can create events" ON public.group_events;
CREATE POLICY "Admins can create events"
ON public.group_events FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_events.group_id AND g.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update events" ON public.group_events;
CREATE POLICY "Admins can update events"
ON public.group_events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_events.group_id AND g.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can delete events" ON public.group_events;
CREATE POLICY "Admins can delete events"
ON public.group_events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_events.group_id AND g.created_by = auth.uid()
  )
);

-- Fix group_invitations policies
DROP POLICY IF EXISTS "Admins can invite" ON public.group_invitations;
CREATE POLICY "Admins can invite"
ON public.group_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by
  AND EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_invitations.group_id AND g.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.group_invitations;
CREATE POLICY "Admins can delete invitations"
ON public.group_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_invitations.group_id AND g.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.group_invitations;
CREATE POLICY "Users can view relevant invitations"
ON public.group_invitations FOR SELECT
USING (
  auth.uid() = invited_user_id
  OR EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_invitations.group_id AND g.created_by = auth.uid()
  )
);

-- Fix group_join_requests policies
DROP POLICY IF EXISTS "Admins can update requests" ON public.group_join_requests;
CREATE POLICY "Admins can update requests"
ON public.group_join_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_join_requests.group_id AND g.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view own requests" ON public.group_join_requests;
CREATE POLICY "Users can view own requests"
ON public.group_join_requests FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_join_requests.group_id AND g.created_by = auth.uid()
  )
);
