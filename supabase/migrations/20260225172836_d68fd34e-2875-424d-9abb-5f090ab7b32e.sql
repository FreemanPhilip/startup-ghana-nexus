
-- Group join requests for private groups
CREATE TABLE public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can request to join" ON public.group_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own requests" ON public.group_join_requests FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = group_join_requests.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);
CREATE POLICY "Admins can update requests" ON public.group_join_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_join_requests.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);
CREATE POLICY "Users can cancel own requests" ON public.group_join_requests FOR DELETE USING (auth.uid() = user_id);

-- Group invitations
CREATE TABLE public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, invited_user_id)
);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can invite" ON public.group_invitations FOR INSERT WITH CHECK (
  auth.uid() = invited_by AND EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = group_invitations.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);
CREATE POLICY "Users can view relevant invitations" ON public.group_invitations FOR SELECT USING (
  auth.uid() = invited_user_id OR EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = group_invitations.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);
CREATE POLICY "Invited users can update" ON public.group_invitations FOR UPDATE USING (auth.uid() = invited_user_id);
CREATE POLICY "Admins can delete invitations" ON public.group_invitations FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_invitations.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);

-- Allow admins to update member roles
CREATE POLICY "Admins can update member roles" ON public.group_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_invitations;
