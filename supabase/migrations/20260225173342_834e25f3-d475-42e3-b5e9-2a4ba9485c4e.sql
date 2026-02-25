
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
