-- Add mission, vision, and social media columns to startups
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS mission text,
ADD COLUMN IF NOT EXISTS vision text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS facebook_url text;