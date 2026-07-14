
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('startup_founder', 'investor', 'mentor', 'ecosystem_partner', 'service_provider', 'admin', 'member');

-- Create enum for membership type
CREATE TYPE public.membership_type AS ENUM ('standard', 'premium');

-- Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified');

-- Create enum for onboarding step
CREATE TYPE public.onboarding_step AS ENUM ('role_selection', 'profile_details', 'kyc', 'subscription', 'completed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  headline TEXT,
  location TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  phone TEXT,
  membership membership_type NOT NULL DEFAULT 'standard',
  verification verification_status NOT NULL DEFAULT 'unverified',
  onboarding_step onboarding_step NOT NULL DEFAULT 'role_selection',
  -- Startup specific
  company_name TEXT,
  company_stage TEXT,
  industry TEXT,
  funding_required NUMERIC,
  team_size INTEGER,
  -- Investor specific
  investment_focus TEXT,
  investment_range TEXT,
  portfolio_size INTEGER,
  -- Mentor specific
  expertise TEXT[],
  years_experience INTEGER,
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'announcement', 'success_story', 'funding', 'event')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Create opportunities table
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'grant', -- grant, funding_call, accelerator, job
  organization text NOT NULL,
  organization_logo text,
  amount text,
  deadline timestamp with time zone,
  location text,
  eligibility text,
  tags text[] DEFAULT '{}',
  application_url text,
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'applied', -- applied, reviewing, accepted, rejected
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Opportunities policies
CREATE POLICY "Anyone can view opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Admins can create opportunities" ON public.opportunities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update opportunities" ON public.opportunities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete opportunities" ON public.opportunities FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Applications policies
CREATE POLICY "Users can view own applications" ON public.opportunity_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can apply" ON public.opportunity_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can withdraw" ON public.opportunity_applications FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities;

-- Conversations table (1-to-1 DMs)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_one UUID NOT NULL,
  participant_two UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_one, participant_two);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_one OR auth.uid() = participant_two);

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (auth.uid() = c.participant_one OR auth.uid() = c.participant_two)
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (auth.uid() = c.participant_one OR auth.uid() = c.participant_two)
  )
);

CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_message_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'users',
  cover_color TEXT DEFAULT 'from-blue-500 to-blue-700',
  created_by UUID NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group posts table
CREATE TABLE public.group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group post likes table
CREATE TABLE public.group_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create group post comments table
CREATE TABLE public.group_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_comments ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Anyone can view public groups" ON public.groups FOR SELECT USING (NOT is_private OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update" ON public.groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Group creators can delete" ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members visible to group members" ON public.group_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND NOT g.is_private));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

-- Group posts policies
CREATE POLICY "Group members can view posts" ON public.group_posts FOR SELECT USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_posts.group_id AND NOT g.is_private));
CREATE POLICY "Group members can create posts" ON public.group_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Authors can update own posts" ON public.group_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.group_posts FOR DELETE USING (auth.uid() = author_id);

-- Group post likes policies
CREATE POLICY "Anyone in group can view likes" ON public.group_post_likes FOR SELECT USING (true);
CREATE POLICY "Members can like posts" ON public.group_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.group_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Group post comments policies
CREATE POLICY "Anyone in group can view comments" ON public.group_post_comments FOR SELECT USING (true);
CREATE POLICY "Members can comment" ON public.group_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON public.group_post_comments FOR DELETE USING (auth.uid() = author_id);

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_group_posts_updated_at BEFORE UPDATE ON public.group_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_post_comments;

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

-- Group events
CREATE TABLE public.group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  is_virtual boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view events" ON public.group_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_events.group_id AND NOT g.is_private)
);
CREATE POLICY "Admins can create events" ON public.group_events FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);
CREATE POLICY "Admins can update events" ON public.group_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);
CREATE POLICY "Admins can delete events" ON public.group_events FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);

-- Event RSVPs
CREATE TABLE public.group_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.group_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view RSVPs" ON public.group_event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON public.group_event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update RSVP" ON public.group_event_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON public.group_event_rsvps FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_event_rsvps;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false);

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add columns to opportunity_applications for the detailed application
ALTER TABLE public.opportunity_applications
ADD COLUMN IF NOT EXISTS cover_letter text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS additional_docs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}';

-- Create pitch_decks table to track uploaded pitch decks
CREATE TABLE public.pitch_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pitch decks" ON public.pitch_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload pitch decks" ON public.pitch_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pitch decks" ON public.pitch_decks FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for pitch decks
INSERT INTO storage.buckets (id, name, public) VALUES ('pitch-decks', 'pitch-decks', false);

CREATE POLICY "Users can upload own pitch decks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own pitch decks" ON storage.objects FOR SELECT USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own pitch decks" ON storage.objects FOR DELETE USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create post-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated users can upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add video_url to posts
ALTER TABLE public.posts ADD COLUMN video_url text;

-- Update opportunities RLS: allow any authenticated user to create
DROP POLICY IF EXISTS "Admins can create opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can create opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow creators to update their own opportunities (plus admins)
DROP POLICY IF EXISTS "Admins can update opportunities" ON public.opportunities;
CREATE POLICY "Creators and admins can update opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Allow creators to delete their own opportunities (plus admins)
DROP POLICY IF EXISTS "Admins can delete opportunities" ON public.opportunities;
CREATE POLICY "Creators and admins can delete opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

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

-- Add category and icon_url to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS icon_url text;

-- Create group_files table
CREATE TABLE public.group_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view files"
ON public.group_files FOR SELECT
USING (
  is_group_public(group_id)
  OR is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Members can upload files"
ON public.group_files FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Uploaders and creators can delete files"
ON public.group_files FOR DELETE
USING (
  auth.uid() = uploaded_by
  OR is_group_creator(auth.uid(), group_id)
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('group-avatars', 'group-avatars', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('group-files', 'group-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for group-avatars
CREATE POLICY "Anyone can view group avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'group-avatars');

CREATE POLICY "Authenticated users can upload group avatars"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'group-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own group avatars"
ON storage.objects FOR DELETE USING (bucket_id = 'group-avatars' AND auth.role() = 'authenticated');

-- Storage policies for group-files
CREATE POLICY "Anyone can view group files"
ON storage.objects FOR SELECT USING (bucket_id = 'group-files');

CREATE POLICY "Authenticated users can upload group files"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'group-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own group files"
ON storage.objects FOR DELETE USING (bucket_id = 'group-files' AND auth.role() = 'authenticated');
ALTER TABLE public.group_posts ADD COLUMN video_url text DEFAULT NULL;
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'follow', 'message', 'group_invitation', 'post_like', 'post_comment', 'group_join_request'
  title text NOT NULL,
  body text,
  actor_id uuid, -- the user who triggered the notification
  reference_id text, -- generic reference (post_id, group_id, conversation_id, etc.)
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System/triggers insert notifications (use service role), but also allow authenticated inserts for actor_id = auth.uid()
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: notify on new follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.following_id,
    'follow',
    'New follower',
    COALESCE(actor_name, 'Someone') || ' started following you',
    NEW.follower_id,
    NEW.follower_id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- Trigger function: notify on new message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
  recipient uuid;
  p_one uuid;
  p_two uuid;
BEGIN
  SELECT participant_one, participant_two INTO p_one, p_two
  FROM public.conversations WHERE id = NEW.conversation_id;
  
  IF NEW.sender_id = p_one THEN
    recipient := p_two;
  ELSE
    recipient := p_one;
  END IF;

  SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    recipient,
    'message',
    'New message',
    COALESCE(actor_name, 'Someone') || ': ' || LEFT(NEW.content, 80),
    NEW.sender_id,
    NEW.conversation_id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_message();

-- Trigger function: notify on group invitation
CREATE OR REPLACE FUNCTION public.notify_on_group_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
  group_name text;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.invited_by;
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.invited_user_id,
    'group_invitation',
    'Group invitation',
    COALESCE(actor_name, 'Someone') || ' invited you to ' || COALESCE(group_name, 'a group'),
    NEW.invited_by,
    NEW.group_id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_invitation
  AFTER INSERT ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_group_invitation();

-- Trigger function: notify on post like
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
  post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author = NEW.user_id THEN RETURN NEW; END IF; -- don't notify self
  
  SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    post_author,
    'post_like',
    'Post liked',
    COALESCE(actor_name, 'Someone') || ' liked your post',
    NEW.user_id,
    NEW.post_id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_post_like();

-- Trigger function: notify on post comment
CREATE OR REPLACE FUNCTION public.notify_on_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
  post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author = NEW.author_id THEN RETURN NEW; END IF; -- don't notify self
  
  SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.author_id;
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    post_author,
    'post_comment',
    'New comment',
    COALESCE(actor_name, 'Someone') || ' commented on your post',
    NEW.author_id,
    NEW.post_id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_post_comment();

-- Fix overly permissive INSERT policy: notifications are only created by SECURITY DEFINER triggers, 
-- so we restrict direct inserts to the user's own notifications
DROP POLICY "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create tables first (no policies yet)
CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  industry text,
  stage text,
  location text,
  short_description text,
  website_url text,
  linkedin_url text,
  registration_doc_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.startup_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

CREATE TABLE public.startup_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add startup_id to posts for identity switching
ALTER TABLE public.posts ADD COLUMN startup_id uuid REFERENCES public.startups(id);

-- Enable RLS
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer functions (tables exist now)
CREATE OR REPLACE FUNCTION public.is_startup_member(_user_id uuid, _startup_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.startup_members WHERE user_id = _user_id AND startup_id = _startup_id) $$;

CREATE OR REPLACE FUNCTION public.is_startup_role(_user_id uuid, _startup_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.startup_members WHERE user_id = _user_id AND startup_id = _startup_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_startup_admin(_user_id uuid, _startup_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.startup_members WHERE user_id = _user_id AND startup_id = _startup_id AND role IN ('owner', 'admin')) $$;

-- RLS policies for startups
CREATE POLICY "Anyone can view startups" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Creators can insert startups" ON public.startups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update startups" ON public.startups FOR UPDATE USING (public.is_startup_admin(auth.uid(), id));
CREATE POLICY "Owners can delete startups" ON public.startups FOR DELETE USING (public.is_startup_role(auth.uid(), id, 'owner'));

-- RLS policies for startup_members
CREATE POLICY "Anyone can view startup members" ON public.startup_members FOR SELECT USING (true);
CREATE POLICY "Admins can add members" ON public.startup_members FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_startup_admin(auth.uid(), startup_id));
CREATE POLICY "Admins can update members" ON public.startup_members FOR UPDATE USING (public.is_startup_admin(auth.uid(), startup_id) OR auth.uid() = user_id);
CREATE POLICY "Admins can remove members" ON public.startup_members FOR DELETE USING (public.is_startup_admin(auth.uid(), startup_id) OR auth.uid() = user_id);

-- RLS policies for startup_invitations
CREATE POLICY "Admins can view invitations" ON public.startup_invitations FOR SELECT USING (public.is_startup_admin(auth.uid(), startup_id));
CREATE POLICY "Admins can create invitations" ON public.startup_invitations FOR INSERT WITH CHECK (auth.uid() = invited_by AND public.is_startup_admin(auth.uid(), startup_id));
CREATE POLICY "Admins can delete invitations" ON public.startup_invitations FOR DELETE USING (public.is_startup_admin(auth.uid(), startup_id));

-- Auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_startup_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.startup_members (startup_id, user_id, role, confirmed) VALUES (NEW.id, NEW.created_by, 'owner', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_startup_created AFTER INSERT ON public.startups FOR EACH ROW EXECUTE FUNCTION public.add_startup_owner();
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for startup logos/docs
INSERT INTO storage.buckets (id, name, public) VALUES ('startup-assets', 'startup-assets', true);
CREATE POLICY "Anyone can view startup assets" ON storage.objects FOR SELECT USING (bucket_id = 'startup-assets');
CREATE POLICY "Auth users can upload startup assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'startup-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users can update startup assets" ON storage.objects FOR UPDATE USING (bucket_id = 'startup-assets' AND auth.uid() IS NOT NULL);

-- Trigger to notify when a startup member is added (not yet confirmed)
CREATE OR REPLACE FUNCTION public.notify_on_startup_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  startup_name text;
  inviter_name text;
BEGIN
  -- Only notify if not confirmed yet and not the owner (owner is auto-added)
  IF NEW.confirmed = true THEN RETURN NEW; END IF;
  
  SELECT name INTO startup_name FROM public.startups WHERE id = NEW.startup_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.user_id,
    'startup_invitation',
    'Startup team invitation',
    'You have been invited to join ' || COALESCE(startup_name, 'a startup') || ' as ' || NEW.role || '. Confirm your affiliation.',
    NULL,
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_startup_member_added
AFTER INSERT ON public.startup_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_startup_member_added();
-- Add booking_url to profiles so mentors can link to their Calendly or booking page
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS booking_url text DEFAULT NULL;
-- Mentor availability slots (recurring weekly slots)
CREATE TABLE public.mentor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_duration integer NOT NULL DEFAULT 30, -- in minutes (15, 30, 45, 60)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mentor bookings
CREATE TABLE public.mentor_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled, completed
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mentor_availability_mentor ON public.mentor_availability(mentor_id);
CREATE INDEX idx_mentor_bookings_mentor ON public.mentor_bookings(mentor_id);
CREATE INDEX idx_mentor_bookings_mentee ON public.mentor_bookings(mentee_id);
CREATE INDEX idx_mentor_bookings_date ON public.mentor_bookings(booking_date);

-- RLS
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;

-- Availability policies
CREATE POLICY "Anyone can view active availability"
  ON public.mentor_availability FOR SELECT
  USING (is_active = true);

CREATE POLICY "Mentors can manage own availability"
  ON public.mentor_availability FOR INSERT
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update own availability"
  ON public.mentor_availability FOR UPDATE
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete own availability"
  ON public.mentor_availability FOR DELETE
  USING (auth.uid() = mentor_id);

-- Booking policies
CREATE POLICY "Mentors and mentees can view their bookings"
  ON public.mentor_bookings FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentees can create bookings"
  ON public.mentor_bookings FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Participants can update bookings"
  ON public.mentor_bookings FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Participants can cancel bookings"
  ON public.mentor_bookings FOR DELETE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Triggers for updated_at
CREATE TRIGGER update_mentor_availability_updated_at
  BEFORE UPDATE ON public.mentor_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_bookings_updated_at
  BEFORE UPDATE ON public.mentor_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to notify mentor when a session is booked
CREATE OR REPLACE FUNCTION public.notify_on_mentor_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mentee_name text;
BEGIN
  SELECT full_name INTO mentee_name FROM public.profiles WHERE user_id = NEW.mentee_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.mentor_id,
    'mentor_booking',
    'New session booked',
    COALESCE(mentee_name, 'Someone') || ' booked a mentorship session on ' || to_char(NEW.booking_date, 'Mon DD, YYYY') || ' at ' || to_char(NEW.start_time, 'HH12:MI AM'),
    NEW.mentee_id,
    NEW.id::text
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_mentor_booking_created
  AFTER INSERT ON public.mentor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mentor_booking();

-- Add image_url to messages for attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Create user presence table for online status tracking
CREATE TABLE public.user_presence (
  user_id UUID NOT NULL PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can view presence (needed for status display)
CREATE POLICY "Anyone can view presence"
ON public.user_presence FOR SELECT
USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON public.user_presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
ON public.user_presence FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Allow conversation participants to delete conversations
CREATE POLICY "Users can delete own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = participant_one OR auth.uid() = participant_two);

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

-- Track which investors users have viewed recently
CREATE TABLE public.investor_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investor_id TEXT NOT NULL,
  investor_name TEXT NOT NULL,
  investor_icon TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investor views" ON public.investor_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investor views" ON public.investor_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investor views" ON public.investor_views
  FOR DELETE USING (auth.uid() = user_id);

-- Track shortlisted investors
CREATE TABLE public.investor_shortlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investor_id TEXT NOT NULL,
  investor_name TEXT NOT NULL,
  investor_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, investor_id)
);

ALTER TABLE public.investor_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortlists" ON public.investor_shortlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortlists" ON public.investor_shortlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortlists" ON public.investor_shortlists
  FOR DELETE USING (auth.uid() = user_id);

-- Session reminders tracking (which reminders have been sent)
CREATE TABLE public.session_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT '24h',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, user_id, reminder_type)
);

ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.session_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders" ON public.session_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
-- Connection requests table (LinkedIn-style accept/reject flow)
CREATE TABLE public.connection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
ON public.connection_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send requests"
ON public.connection_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update requests"
ON public.connection_requests FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete own sent requests"
ON public.connection_requests FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notification trigger for connection requests
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actor_name text;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.receiver_id,
    'connection_request',
    'Connection request',
    COALESCE(actor_name, 'Someone') || ' wants to connect with you',
    NEW.sender_id,
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_connection_request
AFTER INSERT ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_connection_request();

-- When accepted, auto-follow both ways and notify
CREATE OR REPLACE FUNCTION public.on_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actor_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Create mutual follows
    INSERT INTO public.follows (follower_id, following_id) VALUES (NEW.sender_id, NEW.receiver_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.follows (follower_id, following_id) VALUES (NEW.receiver_id, NEW.sender_id) ON CONFLICT DO NOTHING;
    
    -- Notify sender
    SELECT full_name INTO actor_name FROM public.profiles WHERE user_id = NEW.receiver_id;
    INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
    VALUES (
      NEW.sender_id,
      'connection_accepted',
      'Connection accepted',
      COALESCE(actor_name, 'Someone') || ' accepted your connection request',
      NEW.receiver_id,
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_connection_status_change
AFTER UPDATE ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.on_connection_accepted();

-- Add unique constraint on follows to support ON CONFLICT
ALTER TABLE public.follows ADD CONSTRAINT follows_unique_pair UNIQUE (follower_id, following_id);

-- Enable realtime for connection_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;

-- Verification requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_url text,
  linkedin_url text,
  additional_info text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests"
ON public.verification_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Add session_price to mentor_availability
ALTER TABLE public.mentor_availability
ADD COLUMN IF NOT EXISTS session_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Mentor payment records
CREATE TABLE public.mentor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.mentor_bookings(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors and mentees can view their payments"
ON public.mentor_payments FOR SELECT
USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "System can create payments"
ON public.mentor_payments FOR INSERT
WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Participants can update payments"
ON public.mentor_payments FOR UPDATE
USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Trigger for updated_at on verification_requests
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add mission, vision, and social media columns to startups
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS mission text,
ADD COLUMN IF NOT EXISTS vision text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS facebook_url text;
-- Update handle_new_user to auto-assign role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  -- Auto-assign role if provided during signup
  IF NEW.raw_user_meta_data ->> 'primary_role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'primary_role')::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
-- Allow all authenticated users to read roles (needed for role badges across the platform)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Add image_urls array column to posts table for multiple image support
ALTER TABLE public.posts ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing single image_url data to image_urls array
UPDATE public.posts SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';

-- Add image_urls to group_posts as well
ALTER TABLE public.group_posts ADD COLUMN image_urls text[] DEFAULT '{}';
UPDATE public.group_posts SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';

CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated) to insert submissions
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin invitations table for super admin to invite other admins
CREATE TABLE public.admin_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL DEFAULT substring(replace(cast(gen_random_uuid() as text), '-', '') || md5(random()::text), 1, 32),
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_id);

CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.admin_audit_logs (action);

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

-- Fix 1: Restrict profiles SELECT to authenticated users only (protects phone numbers)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Tighten storage DELETE policies for group-avatars and group-files
DROP POLICY IF EXISTS "Users can delete own group avatars" ON storage.objects;
CREATE POLICY "Users can delete own group avatars"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'group-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own group files" ON storage.objects;
CREATE POLICY "Users can delete own group files"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'group-files'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 1. FIX: user_roles self-assign vulnerability
-- ============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Create a restricted INSERT policy: users can only assign non-admin, non-privileged roles to themselves
-- Admin role assignment must go through edge functions with service_role key
CREATE POLICY "Users can insert non-admin roles only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role != 'admin'::app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Allow admins to manage roles via has_role check (for edge function service role operations, 
-- the service role bypasses RLS entirely, so this policy is for admin UI operations)
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. FIX: admin invitation token exposure
-- ============================================

-- Drop the public SELECT policy that leaks tokens
DROP POLICY IF EXISTS "Anyone can verify invitation token" ON public.admin_invitations;

-- Create a secure RPC function for token verification instead
CREATE OR REPLACE FUNCTION public.verify_admin_invitation(_token text)
RETURNS TABLE(id uuid, email text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ai.id, ai.email, ai.status
  FROM public.admin_invitations ai
  WHERE ai.token = _token
    AND ai.status = 'pending'
  LIMIT 1;
$$;

-- Add expires_at column for token expiry
ALTER TABLE public.admin_invitations 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '7 days');

-- ============================================
-- 3. FIX: Profile data exposure
-- ============================================

-- Create a public-facing view that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Update profiles RLS: replace the broad SELECT with owner-scoped full access + restricted public access
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can always see their own full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles fully
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view limited profile data (non-sensitive columns)
-- This allows the app to still fetch basic info for other users
CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 4. FIX: group-files bucket → private
-- ============================================

-- Make the group-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'group-files';

-- Drop existing overly permissive storage policies for group-files
DROP POLICY IF EXISTS "Anyone can view group files" ON storage.objects;

-- Create authenticated-only download policy for group files
CREATE POLICY "Authenticated users can view group files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'group-files');

-- ============================================
-- 5. FIX: contact_submissions permissive INSERT
-- ============================================

-- The current policy WITH CHECK (true) allows anyone including bots
-- Tighten to at least require the data is not empty (columns are NOT NULL so this is partly enforced)
-- We keep it public but add a comment that rate-limiting should be handled at the edge
-- No change needed since NOT NULL constraints already enforce required fields
-- But let's document the intentional public access

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

-- 1. Fix profiles: restrict full SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Remove contact_submissions from realtime publication (no IF EXISTS needed - just try)
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_submissions';
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 3. Fix startup-assets storage: restrict uploads to startup admins
DROP POLICY IF EXISTS "Auth users can upload startup assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update startup assets" ON storage.objects;

CREATE POLICY "Startup admins can upload startup assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'startup-assets'
    AND is_startup_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Startup admins can update startup assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'startup-assets'
    AND is_startup_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- 4. Fix group_post_comments: restrict to group members
DROP POLICY IF EXISTS "Anyone in group can view comments" ON public.group_post_comments;

CREATE POLICY "Group members can view comments"
  ON public.group_post_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      WHERE gp.id = post_id
        AND is_group_member(auth.uid(), gp.group_id)
    )
  );

-- 5. Fix group_post_likes: restrict to group members
DROP POLICY IF EXISTS "Anyone can view likes" ON public.group_post_likes;

CREATE POLICY "Group members can view likes"
  ON public.group_post_likes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      WHERE gp.id = post_id
        AND is_group_member(auth.uid(), gp.group_id)
    )
  );

-- 6. Fix group_event_rsvps: restrict to group members
DROP POLICY IF EXISTS "Anyone can view RSVPs" ON public.group_event_rsvps;

CREATE POLICY "Group members can view RSVPs"
  ON public.group_event_rsvps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_events ge
      WHERE ge.id = event_id
        AND is_group_member(auth.uid(), ge.group_id)
    )
  );

-- 7. Fix group-files storage: restrict SELECT to group members
DROP POLICY IF EXISTS "Authenticated users can view group files" ON storage.objects;

CREATE POLICY "Group members can view group files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'group-files'
    AND is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- 8. Fix group-files storage: restrict upload to group members  
DROP POLICY IF EXISTS "Authenticated users can upload group files" ON storage.objects;

CREATE POLICY "Group members can upload group files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'group-files'
    AND is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

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
-- Sync profile.verification with verification_requests lifecycle
CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status verification_status;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_status := 'pending'::verification_status;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'approved' THEN
      new_status := 'verified'::verification_status;
    ELSIF NEW.status = 'rejected' THEN
      new_status := 'unverified'::verification_status;
    ELSE
      new_status := 'pending'::verification_status;
    END IF;
  END IF;

  UPDATE public.profiles
  SET verification = new_status
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_verification_ins ON public.verification_requests;
CREATE TRIGGER trg_sync_profile_verification_ins
AFTER INSERT ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

DROP TRIGGER IF EXISTS trg_sync_profile_verification_upd ON public.verification_requests;
CREATE TRIGGER trg_sync_profile_verification_upd
AFTER UPDATE OF status ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

-- Backfill: any user with a pending request but unverified profile gets bumped to pending
UPDATE public.profiles p
SET verification = 'pending'::verification_status
FROM public.verification_requests vr
WHERE vr.user_id = p.user_id
  AND vr.status = 'pending'
  AND p.verification = 'unverified'::verification_status;

-- =========================================================================
-- SparkX Ecosystem Index — Phase 1 (additive only)
-- =========================================================================

-- 1. ENUMS -----------------------------------------------------------------
CREATE TYPE public.index_sector AS ENUM (
  'fintech','agritech','healthtech','edtech','ecommerce','logistics',
  'energy','creative','mobility','proptech','insurtech','cleantech',
  'ai','saas','deeptech','media','other'
);

CREATE TYPE public.index_stage AS ENUM (
  'idea','pre_seed','seed','series_a','series_b','series_c','growth','mature'
);

CREATE TYPE public.index_round_type AS ENUM (
  'pre_seed','seed','series_a','series_b','series_c','growth','debt','grant','bridge','other'
);

CREATE TYPE public.index_investor_type AS ENUM (
  'vc','angel','accelerator','corporate','dfi','family_office','syndicate','government','other'
);

CREATE TYPE public.index_source AS ENUM ('admin','scrape','claim','import');

CREATE TYPE public.index_claim_status AS ENUM ('pending','approved','rejected');

-- 2. TABLES ----------------------------------------------------------------

-- index_startups
CREATE TABLE public.index_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  sector public.index_sector,
  stage public.index_stage,
  country TEXT,
  city TEXT,
  founded_year INT,
  team_size INT,
  is_raising BOOLEAN NOT NULL DEFAULT false,
  sparkx_score NUMERIC,
  source public.index_source NOT NULL DEFAULT 'admin',
  verified BOOLEAN NOT NULL DEFAULT false,
  claimed_by_startup_id UUID REFERENCES public.startups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.index_startups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_startups TO authenticated;
GRANT ALL ON public.index_startups TO service_role;
ALTER TABLE public.index_startups ENABLE ROW LEVEL SECURITY;

-- index_investors
CREATE TABLE public.index_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  type public.index_investor_type,
  hq_country TEXT,
  focus_sectors TEXT[] NOT NULL DEFAULT '{}',
  stage_focus TEXT[] NOT NULL DEFAULT '{}',
  check_size_min NUMERIC,
  check_size_max NUMERIC,
  verified BOOLEAN NOT NULL DEFAULT false,
  source public.index_source NOT NULL DEFAULT 'admin',
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.index_investors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_investors TO authenticated;
GRANT ALL ON public.index_investors TO service_role;
ALTER TABLE public.index_investors ENABLE ROW LEVEL SECURITY;

-- index_funding_rounds
CREATE TABLE public.index_funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_startup_id UUID NOT NULL REFERENCES public.index_startups(id) ON DELETE CASCADE,
  round_type public.index_round_type NOT NULL,
  amount_usd NUMERIC,
  announced_on DATE,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.index_funding_rounds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_funding_rounds TO authenticated;
GRANT ALL ON public.index_funding_rounds TO service_role;
ALTER TABLE public.index_funding_rounds ENABLE ROW LEVEL SECURITY;

-- index_round_investors
CREATE TABLE public.index_round_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.index_funding_rounds(id) ON DELETE CASCADE,
  index_investor_id UUID NOT NULL REFERENCES public.index_investors(id) ON DELETE CASCADE,
  is_lead BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, index_investor_id)
);

GRANT SELECT ON public.index_round_investors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_round_investors TO authenticated;
GRANT ALL ON public.index_round_investors TO service_role;
ALTER TABLE public.index_round_investors ENABLE ROW LEVEL SECURITY;

-- index_claims
CREATE TABLE public.index_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_startup_id UUID NOT NULL REFERENCES public.index_startups(id) ON DELETE CASCADE,
  member_startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.index_claim_status NOT NULL DEFAULT 'pending',
  proof_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.index_claims TO authenticated;
GRANT ALL ON public.index_claims TO service_role;
ALTER TABLE public.index_claims ENABLE ROW LEVEL SECURITY;

-- 3. INDEXES ---------------------------------------------------------------
CREATE INDEX idx_index_startups_country_sector_stage ON public.index_startups(country, sector, stage);
CREATE INDEX idx_index_startups_score ON public.index_startups(sparkx_score DESC NULLS LAST);
CREATE INDEX idx_index_startups_claimed ON public.index_startups(claimed_by_startup_id);
CREATE INDEX idx_index_investors_type_country ON public.index_investors(type, hq_country);
CREATE INDEX idx_index_rounds_startup_date ON public.index_funding_rounds(index_startup_id, announced_on DESC);
CREATE INDEX idx_index_claims_status ON public.index_claims(status);
CREATE INDEX idx_index_claims_requested_by ON public.index_claims(requested_by);

-- 4. HELPER FUNCTIONS ------------------------------------------------------

-- Slugify helper
CREATE OR REPLACE FUNCTION public.slugify_index_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '(^-|-$)', '', 'g');
  END IF;
  RETURN NEW;
END;
$$;

-- Whitelist-scope enforcement for non-admin claimant edits on index_startups
CREATE OR REPLACE FUNCTION public.enforce_index_startup_field_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin path: revert any change outside the whitelist
  NEW.name := OLD.name;
  NEW.slug := OLD.slug;
  NEW.sector := OLD.sector;
  NEW.stage := OLD.stage;
  NEW.country := OLD.country;
  NEW.city := OLD.city;
  NEW.founded_year := OLD.founded_year;
  NEW.sparkx_score := OLD.sparkx_score;
  NEW.source := OLD.source;
  NEW.verified := OLD.verified;
  NEW.claimed_by_startup_id := OLD.claimed_by_startup_id;
  NEW.created_by := OLD.created_by;
  RETURN NEW;
END;
$$;

-- Claim approval side effect
CREATE OR REPLACE FUNCTION public.on_index_claim_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.index_startups
       SET claimed_by_startup_id = NEW.member_startup_id,
           verified = true,
           updated_at = now()
     WHERE id = NEW.index_startup_id;
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- 5. TRIGGERS --------------------------------------------------------------

CREATE TRIGGER trg_index_startups_updated_at
  BEFORE UPDATE ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_startups_slug
  BEFORE INSERT ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.slugify_index_name();

CREATE TRIGGER trg_index_startups_field_scope
  BEFORE UPDATE ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_index_startup_field_scope();

CREATE TRIGGER trg_index_investors_updated_at
  BEFORE UPDATE ON public.index_investors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_investors_slug
  BEFORE INSERT ON public.index_investors
  FOR EACH ROW EXECUTE FUNCTION public.slugify_index_name();

CREATE TRIGGER trg_index_rounds_updated_at
  BEFORE UPDATE ON public.index_funding_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_claims_updated_at
  BEFORE UPDATE ON public.index_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_claims_approved
  BEFORE UPDATE ON public.index_claims
  FOR EACH ROW EXECUTE FUNCTION public.on_index_claim_approved();

-- 6. RLS POLICIES ----------------------------------------------------------

-- index_startups
CREATE POLICY "Index startups are public"
  ON public.index_startups FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert index startups"
  ON public.index_startups FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins or claimant owners can update index startups"
  ON public.index_startups FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      claimed_by_startup_id IS NOT NULL
      AND public.is_startup_admin(auth.uid(), claimed_by_startup_id)
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      claimed_by_startup_id IS NOT NULL
      AND public.is_startup_admin(auth.uid(), claimed_by_startup_id)
    )
  );

CREATE POLICY "Admins can delete index startups"
  ON public.index_startups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_investors
CREATE POLICY "Index investors are public"
  ON public.index_investors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage index investors — insert"
  ON public.index_investors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage index investors — update"
  ON public.index_investors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage index investors — delete"
  ON public.index_investors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_funding_rounds
CREATE POLICY "Index rounds are public"
  ON public.index_funding_rounds FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage rounds — insert"
  ON public.index_funding_rounds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage rounds — update"
  ON public.index_funding_rounds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage rounds — delete"
  ON public.index_funding_rounds FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_round_investors
CREATE POLICY "Round investors are public"
  ON public.index_round_investors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage round investors — insert"
  ON public.index_round_investors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage round investors — update"
  ON public.index_round_investors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage round investors — delete"
  ON public.index_round_investors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_claims
CREATE POLICY "Users can view their own claims"
  ON public.index_claims FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create their own claims"
  ON public.index_claims FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.is_startup_admin(auth.uid(), member_startup_id)
  );

CREATE POLICY "Admins can update claims"
  ON public.index_claims FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 1) Revoke EXECUTE from anon/authenticated/PUBLIC on trigger-only SECURITY DEFINER functions
DO $$
DECLARE fn text;
DECLARE fns text[] := ARRAY[
  'public.slugify_index_name()',
  'public.enforce_index_startup_field_scope()',
  'public.on_index_claim_approved()',
  'public.handle_new_user()',
  'public.notify_on_connection_request()',
  'public.notify_on_mentor_booking()',
  'public.notify_on_follow()',
  'public.notify_on_group_invitation()',
  'public.notify_on_post_like()',
  'public.notify_on_message()',
  'public.notify_on_post_comment()',
  'public.notify_on_startup_member_added()',
  'public.update_conversation_last_message()',
  'public.sync_profile_verification()',
  'public.add_startup_owner()',
  'public.on_connection_accepted()',
  'public.update_updated_at_column()'
];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 2) Storage: prevent bucket listing for public buckets (drop broad SELECT policies).
-- Public URLs still work because buckets are public.
DROP POLICY IF EXISTS "Anyone can view group avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post media" ON storage.objects;

-- 3) Storage: restrict INSERT to the user's own folder (path prefix = auth.uid())
DROP POLICY IF EXISTS "Authenticated users can upload group avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload group avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
DROP POLICY IF EXISTS "Anyone can view startup assets" ON storage.objects;