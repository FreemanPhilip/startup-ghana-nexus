
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
