
-- Add category and icon_url to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS icon_url text;

-- Create group_files table
CREATE TABLE public.group_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view files"
ON public.group_files FOR SELECT
USING (
  is_group_public(group_id)
  OR is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Members can upload files"
ON public.group_files FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Uploaders and creators can delete files"
ON public.group_files FOR DELETE
USING (
  auth.uid() = uploaded_by
  OR is_group_creator(auth.uid(), group_id)
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('group-avatars', 'group-avatars', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('group-files', 'group-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for group-avatars
CREATE POLICY "Anyone can view group avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'group-avatars');

CREATE POLICY "Authenticated users can upload group avatars"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'group-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own group avatars"
ON storage.objects FOR DELETE USING (bucket_id = 'group-avatars' AND auth.role() = 'authenticated');

-- Storage policies for group-files
CREATE POLICY "Anyone can view group files"
ON storage.objects FOR SELECT USING (bucket_id = 'group-files');

CREATE POLICY "Authenticated users can upload group files"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'group-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own group files"
ON storage.objects FOR DELETE USING (bucket_id = 'group-files' AND auth.role() = 'authenticated');
