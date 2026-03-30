
-- Admin invitations table for super admin to invite other admins
CREATE TABLE public.admin_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email, status)
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view invitations
CREATE POLICY "Admins can view invitations"
  ON public.admin_invitations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON public.admin_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = invited_by);

-- Only admins can update invitations
CREATE POLICY "Admins can update invitations"
  ON public.admin_invitations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON public.admin_invitations
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow public select by token (for signup flow - unauthenticated)
CREATE POLICY "Anyone can verify invitation token"
  ON public.admin_invitations
  FOR SELECT
  TO public
  USING (status = 'pending');
