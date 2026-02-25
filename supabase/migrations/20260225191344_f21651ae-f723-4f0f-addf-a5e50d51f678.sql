
-- Create post-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated users can upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add video_url to posts
ALTER TABLE public.posts ADD COLUMN video_url text;

-- Update opportunities RLS: allow any authenticated user to create
DROP POLICY IF EXISTS "Admins can create opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can create opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow creators to update their own opportunities (plus admins)
DROP POLICY IF EXISTS "Admins can update opportunities" ON public.opportunities;
CREATE POLICY "Creators and admins can update opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Allow creators to delete their own opportunities (plus admins)
DROP POLICY IF EXISTS "Admins can delete opportunities" ON public.opportunities;
CREATE POLICY "Creators and admins can delete opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
