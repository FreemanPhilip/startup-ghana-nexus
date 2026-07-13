# Phase 1: Ecosystem Index Foundation

Additive-only. The existing social platform (profiles, startups, posts, follows, groups, messaging, mentorship, investors module) is **not touched**. All new objects live under an `index_` prefix so there is zero collision with current tables.

## Goal

Stand up the public, canonical registry of African startups, investors, and funding rounds — plus the bridge that lets a member-owned startup "claim" its index entry.

## What gets built

### 1. New database tables (all in `public`, all prefixed `index_`)

```text
index_startups         canonical startup registry (public read)
index_investors        canonical investor/fund registry (public read)
index_funding_rounds   rounds attached to an index_startup
index_round_investors  join table: which investors participated in a round
index_claims           claim requests linking a member startup -> index_startup
```

**index_startups** — name, slug (unique), logo_url, website_url, description, sector (enum), stage (enum), country, city, founded_year, team_size, is_raising (bool), sparkx_score (numeric, nullable — computed later in Phase 3), source (enum: admin, scrape, claim), verified (bool), claimed_by_startup_id (nullable FK to existing `public.startups.id`), created_by (admin user), timestamps.

**index_investors** — name, slug, logo_url, website_url, type (enum: vc, angel, accelerator, corporate, dfi, family_office, syndicate), hq_country, focus_sectors (text[]), stage_focus (text[]), check_size_min, check_size_max, verified, source, timestamps. Optional `linked_user_id` nullable FK to `auth.users` for when a platform investor user claims an index entry.

**index_funding_rounds** — index_startup_id (FK), round_type (enum: pre_seed, seed, series_a, series_b, series_c, growth, debt, grant), amount_usd, announced_on (date), source_url, notes, timestamps.

**index_round_investors** — round_id (FK), index_investor_id (FK), is_lead (bool). Composite unique (round_id, index_investor_id).

**index_claims** — index_startup_id (FK), member_startup_id (FK to `public.startups.id`), requested_by (user), status (pending/approved/rejected), proof_url, admin_notes, reviewed_by, reviewed_at, timestamps.

### 2. New enums

`index_sector`, `index_stage`, `index_round_type`, `index_investor_type`, `index_source`, `index_claim_status`.

### 3. RLS — public read, admin write, claimant write

- `index_startups`, `index_investors`, `index_funding_rounds`, `index_round_investors`: **SELECT to `anon` and `authenticated`** (fully public — this is the SEO moat).
- INSERT / UPDATE / DELETE on all four: restricted to admins via `has_role(auth.uid(), 'admin')`.
- Additional UPDATE policy on `index_startups`: the owner of the linked member startup (checked via `claimed_by_startup_id` + `startup_members.role in ('owner','admin')`) can update a **whitelisted subset** of columns (description, logo_url, website_url, is_raising, team_size). Enforced with a `BEFORE UPDATE` trigger that reverts non-whitelisted fields for non-admins.
- `index_claims`: user can INSERT their own claim (requested_by = auth.uid()) and SELECT their own claims; admins can SELECT/UPDATE all.

### 4. GRANTs (mandatory, same migration)

```sql
GRANT SELECT ON public.index_startups, public.index_investors,
              public.index_funding_rounds, public.index_round_investors
  TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON <same four> TO authenticated;
GRANT ALL ON <same four> TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.index_claims TO authenticated;
GRANT ALL ON public.index_claims TO service_role;
```

### 5. Triggers / functions

- `update_updated_at_column` reused on every new table.
- `enforce_index_startup_field_scope()` — BEFORE UPDATE trigger keeping non-admin claimant edits within the whitelist.
- `on_claim_approved()` — AFTER UPDATE on `index_claims`: when status flips to `approved`, set `index_startups.claimed_by_startup_id = member_startup_id` and `verified = true`.
- `slugify_index_name()` — BEFORE INSERT to auto-generate slug when null.

### 6. Indexes

`index_startups(slug)` unique, `(country, sector, stage)`, `(sparkx_score DESC NULLS LAST)`, `(claimed_by_startup_id)`.
`index_investors(slug)` unique, `(type, hq_country)`.
`index_funding_rounds(index_startup_id, announced_on DESC)`.

## What does NOT change in this phase

- No changes to `profiles`, `startups`, `posts`, `follows`, `groups`, `messages`, `mentor_*`, `investor_*`, `user_roles`, or any existing RLS policy.
- No frontend routes yet. No `/index` pages. No claim UI. No admin importer. No SparkX Score computation. No seeding.
- No edge functions.

Those land in Phase 2+ once the schema is approved and the types file regenerates.

## Deliverable of Phase 1

One migration containing: enums → tables → GRANTs → RLS enable → policies → triggers → indexes. After approval, the generated Supabase types will expose the new tables so Phase 2 (claim UI + public directory pages) can begin.

## Out of scope (later phases)

- Phase 2: Public `/index` directory pages + claim flow UI.
- Phase 3: SparkX Score edge function (scheduled).
- Phase 4: SEO polish, sitemaps, JSON-LD.
- Phase 5: Firecrawl-powered admin importer + CSV bulk import.

Approve this and I'll write the migration.
