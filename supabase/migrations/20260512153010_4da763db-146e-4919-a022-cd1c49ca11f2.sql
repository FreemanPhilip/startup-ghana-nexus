
-- Sync profile.verification with verification_requests lifecycle
CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status verification_status;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_status := 'pending'::verification_status;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'approved' THEN
      new_status := 'verified'::verification_status;
    ELSIF NEW.status = 'rejected' THEN
      new_status := 'unverified'::verification_status;
    ELSE
      new_status := 'pending'::verification_status;
    END IF;
  END IF;

  UPDATE public.profiles
  SET verification = new_status
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_verification_ins ON public.verification_requests;
CREATE TRIGGER trg_sync_profile_verification_ins
AFTER INSERT ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

DROP TRIGGER IF EXISTS trg_sync_profile_verification_upd ON public.verification_requests;
CREATE TRIGGER trg_sync_profile_verification_upd
AFTER UPDATE OF status ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

-- Backfill: any user with a pending request but unverified profile gets bumped to pending
UPDATE public.profiles p
SET verification = 'pending'::verification_status
FROM public.verification_requests vr
WHERE vr.user_id = p.user_id
  AND vr.status = 'pending'
  AND p.verification = 'unverified'::verification_status;
