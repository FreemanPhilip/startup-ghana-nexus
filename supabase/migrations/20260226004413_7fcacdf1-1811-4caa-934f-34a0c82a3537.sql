
-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Users can block"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Users can unblock"
ON public.blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- Prevent sending messages to users who blocked you
-- Update the existing INSERT policy on messages to also check blocks
-- We need a helper function first
CREATE OR REPLACE FUNCTION public.is_blocked(_user_a UUID, _user_b UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _user_a AND blocked_id = _user_b)
       OR (blocker_id = _user_b AND blocked_id = _user_a)
  )
$$;
