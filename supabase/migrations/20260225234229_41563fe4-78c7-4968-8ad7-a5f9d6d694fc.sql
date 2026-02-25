
-- Trigger to notify mentor when a session is booked
CREATE OR REPLACE FUNCTION public.notify_on_mentor_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mentee_name text;
BEGIN
  SELECT full_name INTO mentee_name FROM public.profiles WHERE user_id = NEW.mentee_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, actor_id, reference_id)
  VALUES (
    NEW.mentor_id,
    'mentor_booking',
    'New session booked',
    COALESCE(mentee_name, 'Someone') || ' booked a mentorship session on ' || to_char(NEW.booking_date, 'Mon DD, YYYY') || ' at ' || to_char(NEW.start_time, 'HH12:MI AM'),
    NEW.mentee_id,
    NEW.id::text
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_mentor_booking_created
  AFTER INSERT ON public.mentor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mentor_booking();
