
-- Fix 1: Restrict profiles SELECT to authenticated users only (protects phone numbers)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Tighten storage DELETE policies for group-avatars and group-files
DROP POLICY IF EXISTS "Users can delete own group avatars" ON storage.objects;
CREATE POLICY "Users can delete own group avatars"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'group-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own group files" ON storage.objects;
CREATE POLICY "Users can delete own group files"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'group-files'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
