
-- Add image_urls array column to posts table for multiple image support
ALTER TABLE public.posts ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing single image_url data to image_urls array
UPDATE public.posts SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';

-- Add image_urls to group_posts as well
ALTER TABLE public.group_posts ADD COLUMN image_urls text[] DEFAULT '{}';
UPDATE public.group_posts SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';
