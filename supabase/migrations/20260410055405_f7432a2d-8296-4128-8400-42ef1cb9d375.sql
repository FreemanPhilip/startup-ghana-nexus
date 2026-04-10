
-- 1. Fix profiles: restrict full SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Remove contact_submissions from realtime publication (no IF EXISTS needed - just try)
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_submissions';
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 3. Fix startup-assets storage: restrict uploads to startup admins
DROP POLICY IF EXISTS "Auth users can upload startup assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update startup assets" ON storage.objects;

CREATE POLICY "Startup admins can upload startup assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'startup-assets'
    AND is_startup_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Startup admins can update startup assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'startup-assets'
    AND is_startup_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- 4. Fix group_post_comments: restrict to group members
DROP POLICY IF EXISTS "Anyone in group can view comments" ON public.group_post_comments;

CREATE POLICY "Group members can view comments"
  ON public.group_post_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      WHERE gp.id = post_id
        AND is_group_member(auth.uid(), gp.group_id)
    )
  );

-- 5. Fix group_post_likes: restrict to group members
DROP POLICY IF EXISTS "Anyone can view likes" ON public.group_post_likes;

CREATE POLICY "Group members can view likes"
  ON public.group_post_likes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      WHERE gp.id = post_id
        AND is_group_member(auth.uid(), gp.group_id)
    )
  );

-- 6. Fix group_event_rsvps: restrict to group members
DROP POLICY IF EXISTS "Anyone can view RSVPs" ON public.group_event_rsvps;

CREATE POLICY "Group members can view RSVPs"
  ON public.group_event_rsvps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_events ge
      WHERE ge.id = event_id
        AND is_group_member(auth.uid(), ge.group_id)
    )
  );

-- 7. Fix group-files storage: restrict SELECT to group members
DROP POLICY IF EXISTS "Authenticated users can view group files" ON storage.objects;

CREATE POLICY "Group members can view group files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'group-files'
    AND is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

-- 8. Fix group-files storage: restrict upload to group members  
DROP POLICY IF EXISTS "Authenticated users can upload group files" ON storage.objects;

CREATE POLICY "Group members can upload group files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'group-files'
    AND is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
