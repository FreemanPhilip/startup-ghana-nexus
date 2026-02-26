
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
