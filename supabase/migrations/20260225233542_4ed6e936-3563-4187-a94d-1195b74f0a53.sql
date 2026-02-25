
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
