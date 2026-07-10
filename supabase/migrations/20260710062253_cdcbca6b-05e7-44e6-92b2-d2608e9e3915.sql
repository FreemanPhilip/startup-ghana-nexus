
-- =========================================================================
-- SparkX Ecosystem Index — Phase 1 (additive only)
-- =========================================================================

-- 1. ENUMS -----------------------------------------------------------------
CREATE TYPE public.index_sector AS ENUM (
  'fintech','agritech','healthtech','edtech','ecommerce','logistics',
  'energy','creative','mobility','proptech','insurtech','cleantech',
  'ai','saas','deeptech','media','other'
);

CREATE TYPE public.index_stage AS ENUM (
  'idea','pre_seed','seed','series_a','series_b','series_c','growth','mature'
);

CREATE TYPE public.index_round_type AS ENUM (
  'pre_seed','seed','series_a','series_b','series_c','growth','debt','grant','bridge','other'
);

CREATE TYPE public.index_investor_type AS ENUM (
  'vc','angel','accelerator','corporate','dfi','family_office','syndicate','government','other'
);

CREATE TYPE public.index_source AS ENUM ('admin','scrape','claim','import');

CREATE TYPE public.index_claim_status AS ENUM ('pending','approved','rejected');

-- 2. TABLES ----------------------------------------------------------------

-- index_startups
CREATE TABLE public.index_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  sector public.index_sector,
  stage public.index_stage,
  country TEXT,
  city TEXT,
  founded_year INT,
  team_size INT,
  is_raising BOOLEAN NOT NULL DEFAULT false,
  sparkx_score NUMERIC,
  source public.index_source NOT NULL DEFAULT 'admin',
  verified BOOLEAN NOT NULL DEFAULT false,
  claimed_by_startup_id UUID REFERENCES public.startups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.index_startups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_startups TO authenticated;
GRANT ALL ON public.index_startups TO service_role;
ALTER TABLE public.index_startups ENABLE ROW LEVEL SECURITY;

-- index_investors
CREATE TABLE public.index_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  type public.index_investor_type,
  hq_country TEXT,
  focus_sectors TEXT[] NOT NULL DEFAULT '{}',
  stage_focus TEXT[] NOT NULL DEFAULT '{}',
  check_size_min NUMERIC,
  check_size_max NUMERIC,
  verified BOOLEAN NOT NULL DEFAULT false,
  source public.index_source NOT NULL DEFAULT 'admin',
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.index_investors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_investors TO authenticated;
GRANT ALL ON public.index_investors TO service_role;
ALTER TABLE public.index_investors ENABLE ROW LEVEL SECURITY;

-- index_funding_rounds
CREATE TABLE public.index_funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_startup_id UUID NOT NULL REFERENCES public.index_startups(id) ON DELETE CASCADE,
  round_type public.index_round_type NOT NULL,
  amount_usd NUMERIC,
  announced_on DATE,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.index_funding_rounds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_funding_rounds TO authenticated;
GRANT ALL ON public.index_funding_rounds TO service_role;
ALTER TABLE public.index_funding_rounds ENABLE ROW LEVEL SECURITY;

-- index_round_investors
CREATE TABLE public.index_round_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.index_funding_rounds(id) ON DELETE CASCADE,
  index_investor_id UUID NOT NULL REFERENCES public.index_investors(id) ON DELETE CASCADE,
  is_lead BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, index_investor_id)
);

GRANT SELECT ON public.index_round_investors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.index_round_investors TO authenticated;
GRANT ALL ON public.index_round_investors TO service_role;
ALTER TABLE public.index_round_investors ENABLE ROW LEVEL SECURITY;

-- index_claims
CREATE TABLE public.index_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_startup_id UUID NOT NULL REFERENCES public.index_startups(id) ON DELETE CASCADE,
  member_startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.index_claim_status NOT NULL DEFAULT 'pending',
  proof_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.index_claims TO authenticated;
GRANT ALL ON public.index_claims TO service_role;
ALTER TABLE public.index_claims ENABLE ROW LEVEL SECURITY;

-- 3. INDEXES ---------------------------------------------------------------
CREATE INDEX idx_index_startups_country_sector_stage ON public.index_startups(country, sector, stage);
CREATE INDEX idx_index_startups_score ON public.index_startups(sparkx_score DESC NULLS LAST);
CREATE INDEX idx_index_startups_claimed ON public.index_startups(claimed_by_startup_id);
CREATE INDEX idx_index_investors_type_country ON public.index_investors(type, hq_country);
CREATE INDEX idx_index_rounds_startup_date ON public.index_funding_rounds(index_startup_id, announced_on DESC);
CREATE INDEX idx_index_claims_status ON public.index_claims(status);
CREATE INDEX idx_index_claims_requested_by ON public.index_claims(requested_by);

-- 4. HELPER FUNCTIONS ------------------------------------------------------

-- Slugify helper
CREATE OR REPLACE FUNCTION public.slugify_index_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '(^-|-$)', '', 'g');
  END IF;
  RETURN NEW;
END;
$$;

-- Whitelist-scope enforcement for non-admin claimant edits on index_startups
CREATE OR REPLACE FUNCTION public.enforce_index_startup_field_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin path: revert any change outside the whitelist
  NEW.name := OLD.name;
  NEW.slug := OLD.slug;
  NEW.sector := OLD.sector;
  NEW.stage := OLD.stage;
  NEW.country := OLD.country;
  NEW.city := OLD.city;
  NEW.founded_year := OLD.founded_year;
  NEW.sparkx_score := OLD.sparkx_score;
  NEW.source := OLD.source;
  NEW.verified := OLD.verified;
  NEW.claimed_by_startup_id := OLD.claimed_by_startup_id;
  NEW.created_by := OLD.created_by;
  RETURN NEW;
END;
$$;

-- Claim approval side effect
CREATE OR REPLACE FUNCTION public.on_index_claim_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.index_startups
       SET claimed_by_startup_id = NEW.member_startup_id,
           verified = true,
           updated_at = now()
     WHERE id = NEW.index_startup_id;
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- 5. TRIGGERS --------------------------------------------------------------

CREATE TRIGGER trg_index_startups_updated_at
  BEFORE UPDATE ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_startups_slug
  BEFORE INSERT ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.slugify_index_name();

CREATE TRIGGER trg_index_startups_field_scope
  BEFORE UPDATE ON public.index_startups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_index_startup_field_scope();

CREATE TRIGGER trg_index_investors_updated_at
  BEFORE UPDATE ON public.index_investors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_investors_slug
  BEFORE INSERT ON public.index_investors
  FOR EACH ROW EXECUTE FUNCTION public.slugify_index_name();

CREATE TRIGGER trg_index_rounds_updated_at
  BEFORE UPDATE ON public.index_funding_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_claims_updated_at
  BEFORE UPDATE ON public.index_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_index_claims_approved
  BEFORE UPDATE ON public.index_claims
  FOR EACH ROW EXECUTE FUNCTION public.on_index_claim_approved();

-- 6. RLS POLICIES ----------------------------------------------------------

-- index_startups
CREATE POLICY "Index startups are public"
  ON public.index_startups FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert index startups"
  ON public.index_startups FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins or claimant owners can update index startups"
  ON public.index_startups FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      claimed_by_startup_id IS NOT NULL
      AND public.is_startup_admin(auth.uid(), claimed_by_startup_id)
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      claimed_by_startup_id IS NOT NULL
      AND public.is_startup_admin(auth.uid(), claimed_by_startup_id)
    )
  );

CREATE POLICY "Admins can delete index startups"
  ON public.index_startups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_investors
CREATE POLICY "Index investors are public"
  ON public.index_investors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage index investors — insert"
  ON public.index_investors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage index investors — update"
  ON public.index_investors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage index investors — delete"
  ON public.index_investors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_funding_rounds
CREATE POLICY "Index rounds are public"
  ON public.index_funding_rounds FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage rounds — insert"
  ON public.index_funding_rounds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage rounds — update"
  ON public.index_funding_rounds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage rounds — delete"
  ON public.index_funding_rounds FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_round_investors
CREATE POLICY "Round investors are public"
  ON public.index_round_investors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage round investors — insert"
  ON public.index_round_investors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage round investors — update"
  ON public.index_round_investors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage round investors — delete"
  ON public.index_round_investors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index_claims
CREATE POLICY "Users can view their own claims"
  ON public.index_claims FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create their own claims"
  ON public.index_claims FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.is_startup_admin(auth.uid(), member_startup_id)
  );

CREATE POLICY "Admins can update claims"
  ON public.index_claims FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
