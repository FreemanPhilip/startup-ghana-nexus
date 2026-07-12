# Plan: Role-Based Home, Feed, Claims & Admin Extensions

This spans three connected features. All queries reuse existing tables (`index_startups`, `index_funding_rounds`, `index_investors`, `index_round_investors`, `posts`, `post_likes`, `post_comments`, `profiles`, `follows`) plus a few new tables. The existing social layer stays intact — we extend `posts` rather than replace it.

---

## 1. Role-Based Home Page (`/home`)

New page `src/pages/HomePage.tsx` that reads `profiles.primary_role` and renders one of these views. Add route + redirect from `getRoleDashboardPath` so post-login lands here.

- **founder** — Their claimed startup card (sparkx_score, followers, profile views placeholder=0), a "Complete your profile" checklist that inspects the same fields `compute_sparkx_score` uses (logo, description>100, website, team_size, founded_year, sector, verified, funding rounds) and shows missing points, and investors whose `sectors_focus` overlaps the startup's sector.
- **investor** — Top 10 startups by `sparkx_score` filtered to the investor's `sectors_focus`, a "Raising now" strip (`is_raising=true`), and newest `index_funding_rounds` where `verified=true`.
- **government / development_partner** — Ecosystem dashboard: stat cards (total startups, total verified funding USD sum, rounds this quarter) + recharts BarChart (funding by sector) + Donut/PieChart (startups by stage).
- **incubator / corporate / bank** — "Rising startups" ranked by score delta over 30 days (needs score history — see §5), sector filter dropdown.
- **media / university / student** — Latest verified funding rounds as news cards, top-ranked startups list, link to `/ecosystem` (same dashboard as gov view).

Featured section (top of every view): startups with `is_featured=true`, labeled "Featured this week — editorial picks".

## 2. Feed with Post Types & Funding Announcements

Extend existing `posts` table with `post_type` (enum: `update`, `funding_announcement`, `milestone`, `hiring`) and keep existing likes/comments (`post_likes`, `post_comments` already exist with RLS).

New composer in `src/components/feed/CreatePost.tsx` (or extend existing `CreatePostCard`):
- post_type selector
- if `funding_announcement`: amount (USD), round stage, announced_on date, investors multi-select from `index_investors`
- on submit: insert a `posts` row AND insert an `index_funding_rounds` row with `verified=false`, linked to the author's claimed startup, plus `index_round_investors` rows for each selected investor.

Feed page `src/pages/FeedPage.tsx` renders posts with author, role badge, timestamp, like/comment counts (reuse existing `PostCard`), plus a linked startup card when `startup_id` is set.

## 3. Claim Startup Flow

Add "Claim this startup" button on `StartupDetailPage` when `claimed_by_startup_id IS NULL`. Opens a dialog collecting `evidence` (textarea: email domain, LinkedIn, role proof). Reuses the existing `index_claims` table (already has `member_startup_id`, `index_startup_id`, `status`, `evidence`) — no new table needed; we'll pass the user's owned member startup id.

## 4. Admin Dashboard Extensions

Extend the existing `/admin/dashboard` with three tabs (added to `AdminSidebar` + `AdminDashboardPage`):
1. **Claims Queue** — lists `index_claims` where `status='pending'`; approve triggers existing `on_index_claim_approved` (sets `claimed_by_startup_id`, `verified=true`); reject sets `status='rejected'`.
2. **Funding Verification** — lists `index_funding_rounds` where `verified=false`; approve sets `verified=true`, reject deletes the row (and optionally flags the source post).
3. **Feature Manager** — pick up to 3 `index_startups` to set `is_featured=true`; enforces the 3-cap client + DB side.

## 5. Database Changes (single migration)

```sql
-- posts.post_type
CREATE TYPE public.post_type AS ENUM ('update','funding_announcement','milestone','hiring');
ALTER TABLE public.posts ADD COLUMN post_type post_type NOT NULL DEFAULT 'update';

-- funding rounds verified flag already exists; add source_post linkage
ALTER TABLE public.index_funding_rounds ADD COLUMN source_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- Featured startups (cap 3 enforced via partial unique + trigger)
ALTER TABLE public.index_startups ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.index_startups ADD COLUMN featured_at timestamptz;
CREATE OR REPLACE FUNCTION public.enforce_featured_cap() RETURNS trigger ...
  -- raises exception if count(is_featured)>3
CREATE TRIGGER trg_featured_cap BEFORE INSERT OR UPDATE ...;

-- Score history for "rising startups"
CREATE TABLE public.sparkx_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_startup_id uuid NOT NULL REFERENCES public.index_startups(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sparkx_score_history TO anon, authenticated;
GRANT ALL ON public.sparkx_score_history TO service_role;
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history public read" ... FOR SELECT USING (true);
-- Nightly pg_cron snapshot job appended.
```

Note: existing `index_claims` table already covers claim requests. Existing `post_likes` / `post_comments` already exist. No new likes/comments tables needed.

## 6. Files

**New**
- `src/pages/HomePage.tsx`, `src/pages/FeedPage.tsx`, `src/pages/EcosystemDashboardPage.tsx`
- `src/components/home/{FounderHome,InvestorHome,EcosystemHome,PartnerHome,MediaHome,FeaturedStrip,ProfileChecklist}.tsx`
- `src/components/feed/CreatePostDialog.tsx` (with funding fields)
- `src/components/startups/ClaimStartupDialog.tsx`
- `src/components/admin/{AdminClaimsQueue,AdminFundingVerification,AdminFeatureManager}.tsx`
- One SQL migration.

**Edited**
- `src/App.tsx` — add `/home`, `/feed`, `/ecosystem` routes.
- `src/lib/roleRouting.ts` — post-login → `/home`.
- `src/pages/StartupDetailPage.tsx` — add Claim button + Featured badge.
- `src/pages/AdminDashboardPage.tsx` + `AdminSidebar.tsx` — add 3 tabs.

## Out of scope
- Real "profile views" tracking (placeholder shown as 0 with tooltip).
- Deep editorial workflow for featured picks beyond a simple toggle.
