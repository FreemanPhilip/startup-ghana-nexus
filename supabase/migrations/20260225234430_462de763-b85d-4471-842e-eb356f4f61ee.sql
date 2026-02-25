
-- Add image_url to messages for attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
