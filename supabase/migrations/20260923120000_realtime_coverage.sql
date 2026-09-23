-- Extend realtime coverage to the rest of the platform.
--
-- A client subscription is a no-op unless the table is a member of the
-- supabase_realtime publication, so the app could subscribe to these all day
-- and never receive an event. Posts, messages, notifications, groups,
-- follows and connections were already published; mentorship, startups, the
-- SparkX Index, applications, verification and likes were not, which is why
-- those screens only updated on a manual refresh.
--
-- Idempotent: re-running is safe, and a table that does not exist yet (for
-- example on a project that has not applied the cohort migration) is skipped
-- rather than aborting the whole migration.

DO $$
DECLARE
  target text;
  targets text[] := ARRAY[
    -- Mentorship: cohort requests, sessions, tasks and meetings.
    'mentor_mentees',
    'mentor_bookings',
    'mentor_tasks',
    'mentor_meetings',
    -- Startup profiles and their teams.
    'startups',
    'startup_members',
    'startup_invitations',
    -- The public SparkX Index.
    'index_startups',
    'index_investors',
    'index_funding_rounds',
    -- Opportunities already published; applications did not.
    'opportunity_applications',
    -- Admin queues.
    'verification_requests',
    -- Engagement counters that drive visible numbers.
    'post_likes',
    'group_post_likes',
    'group_members'
  ];
BEGIN
  FOREACH target IN ARRAY targets LOOP
    -- Skip tables this project does not have.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = target
    ) THEN
      RAISE NOTICE 'realtime: skipping %, table not present', target;
      CONTINUE;
    END IF;

    -- Skip tables already in the publication.
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = target
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target);
    RAISE NOTICE 'realtime: published %', target;
  END LOOP;
END $$;
