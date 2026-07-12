
ALTER TABLE public.index_funding_rounds
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Existing rows imported by admin/scrape should stay trusted
UPDATE public.index_funding_rounds SET verified = true WHERE verified = false;
