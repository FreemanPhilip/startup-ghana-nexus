-- Restrict startup creation to founders.
--
-- The original policy was "Creators can insert startups" WITH CHECK
-- (auth.uid() = created_by). That only checks you are not creating a page in
-- someone else's name — it does not check that you are a founder at all. Any
-- authenticated account, including one that onboarded as an investor, mentor,
-- partner or a plain member, could insert a startup row straight through the
-- API, and the add_startup_owner trigger would then make them its owner.
--
-- The interface already pointed founders at the founder dashboard, but that is
-- routing, not authorisation: it stops a link being visible, not a request
-- being made. This moves the rule to where it is enforced.
--
-- Admins are included so support can set a page up on a founder's behalf.

DROP POLICY IF EXISTS "Creators can insert startups" ON public.startups;

CREATE POLICY "Founders can insert startups"
  ON public.startups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Still yours: no creating a page in someone else's name.
    auth.uid() = created_by
    AND (
      public.has_role(auth.uid(), 'startup_founder')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

COMMENT ON POLICY "Founders can insert startups" ON public.startups IS
  'Only accounts holding startup_founder (or admin) may create a startup page, and only in their own name.';
