
-- Trigger to notify when a startup member is added (not yet confirmed)
CREATE OR REPLACE FUNCTION public.notify_on_startup_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  startup_name text;
  inviter_name text;
BEGIN
  -- Only notify if not confirmed yet and not the owner (owner is auto-added)
  IF NEW.confirmed = true THEN RETURN NEW; END IF;
  
  SELECT name INTO startup_name FROM public.startups WHERE id = NEW.startup_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.user_id,
    'startup_invitation',
    'Startup team invitation',
    'You have been invited to join ' || COALESCE(startup_name, 'a startup') || ' as ' || NEW.role || '. Confirm your affiliation.',
    NULL,
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_startup_member_added
AFTER INSERT ON public.startup_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_startup_member_added();
