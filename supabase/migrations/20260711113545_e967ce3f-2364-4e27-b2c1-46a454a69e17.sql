
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.compute_sparkx_score(_startup_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.index_startups%ROWTYPE;
  completeness int := 0;
  verification int := 0;
  funding int := 0;
  engagement int := 0;
  freshness int := 0;
  round_count int := 0;
  recent_round_count int := 0;
  follower_count int := 0;
  days_since_update int;
BEGIN
  SELECT * INTO s FROM public.index_startups WHERE id = _startup_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF s.logo_url IS NOT NULL AND length(s.logo_url) > 0 THEN completeness := completeness + 5; END IF;
  IF s.description IS NOT NULL AND length(s.description) > 100 THEN completeness := completeness + 5; END IF;
  IF s.website_url IS NOT NULL AND length(s.website_url) > 0 THEN completeness := completeness + 5; END IF;
  IF s.team_size IS NOT NULL AND s.team_size > 0 THEN completeness := completeness + 5; END IF;
  IF s.founded_year IS NOT NULL THEN completeness := completeness + 5; END IF;
  IF s.sector IS NOT NULL THEN completeness := completeness + 5; END IF;

  IF s.verified THEN verification := 20; END IF;

  SELECT COUNT(*) INTO round_count FROM public.index_funding_rounds WHERE index_startup_id = _startup_id;
  SELECT COUNT(*) INTO recent_round_count
    FROM public.index_funding_rounds
    WHERE index_startup_id = _startup_id
      AND announced_on IS NOT NULL
      AND announced_on >= (CURRENT_DATE - INTERVAL '12 months');
  IF round_count >= 1 THEN funding := funding + 10; END IF;
  IF recent_round_count >= 1 THEN funding := funding + 10; END IF;
  IF round_count > 1 THEN funding := funding + 5; END IF;

  IF s.claimed_by_startup_id IS NOT NULL THEN
    SELECT COUNT(*) INTO follower_count
    FROM public.follows f
    JOIN public.startups st ON st.created_by = f.following_id
    WHERE st.id = s.claimed_by_startup_id;
    engagement := LEAST(15, follower_count / 5);
  END IF;

  days_since_update := EXTRACT(DAY FROM (now() - s.updated_at));
  IF days_since_update <= 30 THEN freshness := 10;
  ELSIF days_since_update <= 90 THEN freshness := 5;
  ELSE freshness := 0;
  END IF;

  RETURN LEAST(100, completeness + verification + funding + engagement + freshness);
END;
$$;

REVOKE ALL ON FUNCTION public.compute_sparkx_score(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_sparkx_score(_startup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.index_startups
     SET sparkx_score = public.compute_sparkx_score(_startup_id)
   WHERE id = _startup_id;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_sparkx_score(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_all_sparkx_scores()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count int;
BEGIN
  WITH scored AS (
    SELECT id, public.compute_sparkx_score(id) AS score
    FROM public.index_startups
  )
  UPDATE public.index_startups s
     SET sparkx_score = scored.score
    FROM scored
   WHERE s.id = scored.id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_all_sparkx_scores() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_refresh_sparkx_on_startup_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR
     NEW.name IS DISTINCT FROM OLD.name OR
     NEW.logo_url IS DISTINCT FROM OLD.logo_url OR
     NEW.description IS DISTINCT FROM OLD.description OR
     NEW.website_url IS DISTINCT FROM OLD.website_url OR
     NEW.sector IS DISTINCT FROM OLD.sector OR
     NEW.stage IS DISTINCT FROM OLD.stage OR
     NEW.country IS DISTINCT FROM OLD.country OR
     NEW.city IS DISTINCT FROM OLD.city OR
     NEW.founded_year IS DISTINCT FROM OLD.founded_year OR
     NEW.team_size IS DISTINCT FROM OLD.team_size OR
     NEW.verified IS DISTINCT FROM OLD.verified OR
     NEW.claimed_by_startup_id IS DISTINCT FROM OLD.claimed_by_startup_id
  THEN
    NEW.sparkx_score := public.compute_sparkx_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sparkx_on_startup_update ON public.index_startups;
CREATE TRIGGER trg_sparkx_on_startup_update
BEFORE INSERT OR UPDATE ON public.index_startups
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_sparkx_on_startup_update();

CREATE OR REPLACE FUNCTION public.trg_refresh_sparkx_on_funding_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_sparkx_score(OLD.index_startup_id);
    RETURN OLD;
  ELSE
    PERFORM public.refresh_sparkx_score(NEW.index_startup_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sparkx_on_funding_change ON public.index_funding_rounds;
CREATE TRIGGER trg_sparkx_on_funding_change
AFTER INSERT OR UPDATE OR DELETE ON public.index_funding_rounds
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_sparkx_on_funding_change();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-sparkx-refresh') THEN
    PERFORM cron.unschedule('nightly-sparkx-refresh');
  END IF;
END $$;

SELECT cron.schedule(
  'nightly-sparkx-refresh',
  '0 2 * * *',
  $$ SELECT public.refresh_all_sparkx_scores(); $$
);

SELECT public.refresh_all_sparkx_scores();
