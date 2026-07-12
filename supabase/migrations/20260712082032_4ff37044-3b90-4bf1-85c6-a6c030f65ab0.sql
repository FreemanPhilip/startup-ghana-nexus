
-- 1. Post type enum + column
DO $$ BEGIN
  CREATE TYPE public.post_type AS ENUM ('update','funding_announcement','milestone','hiring');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_type public.post_type NOT NULL DEFAULT 'update';

-- 2. Funding round source post linkage
ALTER TABLE public.index_funding_rounds
  ADD COLUMN IF NOT EXISTS source_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- 3. Featured startups
ALTER TABLE public.index_startups
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_featured_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE cnt int;
BEGIN
  IF NEW.is_featured = true AND (OLD.is_featured IS DISTINCT FROM true) THEN
    SELECT COUNT(*) INTO cnt FROM public.index_startups WHERE is_featured = true AND id <> NEW.id;
    IF cnt >= 3 THEN
      RAISE EXCEPTION 'Only 3 startups can be featured at a time. Unfeature one first.';
    END IF;
    NEW.featured_at := now();
  ELSIF NEW.is_featured = false THEN
    NEW.featured_at := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_featured_cap ON public.index_startups;
CREATE TRIGGER trg_featured_cap
  BEFORE INSERT OR UPDATE OF is_featured ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_featured_cap();

REVOKE EXECUTE ON FUNCTION public.enforce_featured_cap() FROM PUBLIC, anon, authenticated;

-- 4. Partner sub-type on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_type text;

-- 5. SparkX score history
CREATE TABLE IF NOT EXISTS public.sparkx_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_startup_id uuid NOT NULL REFERENCES public.index_startups(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sparkx_history_startup_time
  ON public.sparkx_score_history (index_startup_id, captured_at DESC);

GRANT SELECT ON public.sparkx_score_history TO anon, authenticated;
GRANT ALL ON public.sparkx_score_history TO service_role;

ALTER TABLE public.sparkx_score_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "score history public read" ON public.sparkx_score_history;
CREATE POLICY "score history public read"
  ON public.sparkx_score_history FOR SELECT
  USING (true);

-- Seed one snapshot per startup now so "rising" queries have a baseline
INSERT INTO public.sparkx_score_history (index_startup_id, score)
SELECT id, COALESCE(sparkx_score, 0) FROM public.index_startups
ON CONFLICT DO NOTHING;
