
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
