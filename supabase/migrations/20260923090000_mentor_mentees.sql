-- Mentor cohorts: an explicit mentor <-> mentee relationship.
--
-- Until now a mentor's "cohort" was inferred from distinct mentee_ids in
-- mentor_bookings, so a mentee only appeared once they had booked a session.
-- There was no way for a mentee to ask to join a cohort, and no way for an
-- admin to assign one. This table makes the relationship first class.

CREATE TABLE public.mentor_mentees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  -- pending  : mentee asked to join, mentor has not answered
  -- active   : in the cohort
  -- declined : mentor said no
  -- ended    : was active, relationship closed by either side
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'ended')),
  -- How the row came to exist, so the UI can explain it.
  source text NOT NULL DEFAULT 'request' CHECK (source IN ('request', 'admin', 'booking')),
  note text,
  assigned_by uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentor_mentees_not_self CHECK (mentor_id <> mentee_id),
  CONSTRAINT mentor_mentees_unique_pair UNIQUE (mentor_id, mentee_id)
);

CREATE INDEX idx_mentor_mentees_mentor ON public.mentor_mentees(mentor_id);
CREATE INDEX idx_mentor_mentees_mentee ON public.mentor_mentees(mentee_id);
CREATE INDEX idx_mentor_mentees_status ON public.mentor_mentees(status);

ALTER TABLE public.mentor_mentees ENABLE ROW LEVEL SECURITY;

-- Both sides of the relationship can see it; admins can see all.
CREATE POLICY "Mentor mentee pairs are visible to both sides"
  ON public.mentor_mentees FOR SELECT
  USING (
    auth.uid() = mentor_id
    OR auth.uid() = mentee_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- A mentee may only ever create a pending request for themselves. Anything
-- that puts someone straight into a cohort has to come from an admin.
CREATE POLICY "Mentees can request to join a cohort"
  ON public.mentor_mentees FOR INSERT
  WITH CHECK (
    auth.uid() = mentee_id
    AND status = 'pending'
    AND source = 'request'
  );

CREATE POLICY "Admins can assign mentees"
  ON public.mentor_mentees FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- The mentor answers requests and can end the relationship.
CREATE POLICY "Mentors can update their cohort"
  ON public.mentor_mentees FOR UPDATE
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

-- The mentee can withdraw a request or leave a cohort, but must not be able to
-- approve themselves into one.
CREATE POLICY "Mentees can withdraw or leave"
  ON public.mentor_mentees FOR UPDATE
  USING (auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentee_id AND status IN ('ended', 'declined'));

CREATE POLICY "Admins can update any pairing"
  ON public.mentor_mentees FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can remove pairings"
  ON public.mentor_mentees FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Keep updated_at honest.
CREATE TRIGGER set_mentor_mentees_updated_at
  BEFORE UPDATE ON public.mentor_mentees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify the mentor when someone asks to join, and the mentee when answered.
CREATE OR REPLACE FUNCTION public.notify_on_mentorship_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mentee_name text;
  mentor_name text;
BEGIN
  SELECT full_name INTO mentee_name FROM public.profiles WHERE user_id = NEW.mentee_id;
  SELECT full_name INTO mentor_name FROM public.profiles WHERE user_id = NEW.mentor_id;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN
      INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
      VALUES (
        NEW.mentor_id,
        'mentorship_request',
        'New mentorship request',
        COALESCE(mentee_name, 'Someone') || ' asked to join your cohort.',
        NEW.mentee_id,
        NEW.id::text
      );
    ELSIF NEW.status = 'active' THEN
      -- Admin placed them directly into the cohort: tell both sides.
      INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
      VALUES (
        NEW.mentor_id,
        'mentorship_assigned',
        'New mentee assigned',
        COALESCE(mentee_name, 'A mentee') || ' was added to your cohort.',
        NEW.assigned_by,
        NEW.id::text
      ), (
        NEW.mentee_id,
        'mentorship_assigned',
        'You were matched with a mentor',
        'You were added to ' || COALESCE(mentor_name, 'a mentor') || '''s cohort.',
        NEW.assigned_by,
        NEW.id::text
      );
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'active' THEN
      INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
      VALUES (
        NEW.mentee_id,
        'mentorship_accepted',
        'Mentorship request accepted',
        COALESCE(mentor_name, 'Your mentor') || ' accepted you into their cohort.',
        NEW.mentor_id,
        NEW.id::text
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
      VALUES (
        NEW.mentee_id,
        'mentorship_declined',
        'Mentorship request declined',
        COALESCE(mentor_name, 'The mentor') || ' is not taking on new mentees right now.',
        NEW.mentor_id,
        NEW.id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_on_mentorship_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER notify_mentorship_change
  AFTER INSERT OR UPDATE ON public.mentor_mentees
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_mentorship_change();

-- Backfill: anyone who already booked a session with a mentor is already in
-- that mentor's cohort today, so preserve those relationships. Inserted
-- directly (not via the trigger's notification path) to avoid spamming
-- everyone with notifications for pre-existing pairs.
ALTER TABLE public.mentor_mentees DISABLE TRIGGER notify_mentorship_change;

INSERT INTO public.mentor_mentees (mentor_id, mentee_id, status, source, requested_at, responded_at)
SELECT DISTINCT ON (b.mentor_id, b.mentee_id)
  b.mentor_id,
  b.mentee_id,
  'active',
  'booking',
  MIN(b.created_at) OVER (PARTITION BY b.mentor_id, b.mentee_id),
  MIN(b.created_at) OVER (PARTITION BY b.mentor_id, b.mentee_id)
FROM public.mentor_bookings b
WHERE b.mentor_id IS NOT NULL
  AND b.mentee_id IS NOT NULL
  AND b.mentor_id <> b.mentee_id
ON CONFLICT (mentor_id, mentee_id) DO NOTHING;

ALTER TABLE public.mentor_mentees ENABLE TRIGGER notify_mentorship_change;

-- A booking with a mentor should also put the mentee in the cohort going
-- forward, so the two views never drift apart again.
CREATE OR REPLACE FUNCTION public.ensure_cohort_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.mentor_id IS NULL OR NEW.mentee_id IS NULL OR NEW.mentor_id = NEW.mentee_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.mentor_mentees (mentor_id, mentee_id, status, source, responded_at)
  VALUES (NEW.mentor_id, NEW.mentee_id, 'active', 'booking', now())
  ON CONFLICT (mentor_id, mentee_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_cohort_on_booking() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ensure_cohort_after_booking
  AFTER INSERT ON public.mentor_bookings
  FOR EACH ROW EXECUTE FUNCTION public.ensure_cohort_on_booking();
