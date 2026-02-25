-- Add booking_url to profiles so mentors can link to their Calendly or booking page
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS booking_url text DEFAULT NULL;