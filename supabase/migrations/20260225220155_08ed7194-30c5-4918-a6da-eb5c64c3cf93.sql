
-- Fix overly permissive INSERT policy: notifications are only created by SECURITY DEFINER triggers, 
-- so we restrict direct inserts to the user's own notifications
DROP POLICY "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
