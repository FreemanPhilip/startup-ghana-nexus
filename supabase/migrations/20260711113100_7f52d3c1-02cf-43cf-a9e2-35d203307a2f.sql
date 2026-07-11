
-- 1) Revoke EXECUTE from anon/authenticated/PUBLIC on trigger-only SECURITY DEFINER functions
DO $$
DECLARE fn text;
DECLARE fns text[] := ARRAY[
  'public.slugify_index_name()',
  'public.enforce_index_startup_field_scope()',
  'public.on_index_claim_approved()',
  'public.handle_new_user()',
  'public.notify_on_connection_request()',
  'public.notify_on_mentor_booking()',
  'public.notify_on_follow()',
  'public.notify_on_group_invitation()',
  'public.notify_on_post_like()',
  'public.notify_on_message()',
  'public.notify_on_post_comment()',
  'public.notify_on_startup_member_added()',
  'public.update_conversation_last_message()',
  'public.sync_profile_verification()',
  'public.add_startup_owner()',
  'public.on_connection_accepted()',
  'public.update_updated_at_column()'
];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 2) Storage: prevent bucket listing for public buckets (drop broad SELECT policies).
-- Public URLs still work because buckets are public.
DROP POLICY IF EXISTS "Anyone can view group avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post media" ON storage.objects;

-- 3) Storage: restrict INSERT to the user's own folder (path prefix = auth.uid())
DROP POLICY IF EXISTS "Authenticated users can upload group avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload group avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
