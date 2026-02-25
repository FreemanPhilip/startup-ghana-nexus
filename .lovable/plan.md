

## Plan: Make Post Creation Fully Functional with Media, Events & Articles — Plus Allow Investors to Post Opportunities

This plan covers two major areas: (1) making the CreatePostCard action buttons (Photo, Video, Event, Write Article) fully functional with real uploads and forms, and (2) allowing investors/ecosystem partners to create opportunities directly from the platform.

---

### What Changes

**1. Database Migration**
- Add a `video_url` column to the `posts` table (text, nullable) to support video posts alongside existing `image_url`
- Create a public `post-media` storage bucket for images and videos attached to posts
- Add RLS policies on the storage bucket so authenticated users can upload, and anyone can view
- Update `opportunities` RLS: allow any authenticated user to INSERT (not just admins), so investors and ecosystem partners can post opportunities. The `created_by` field will track ownership

**2. Enhanced CreatePostCard** (`src/components/dashboard/CreatePostCard.tsx`)
- **Photo button**: Opens a file picker for images (jpg/png/webp), uploads to `post-media` bucket, previews the selected image before posting, stores the URL in `image_url`
- **Video button**: Opens a file picker for video (mp4/webm, max 50MB), uploads to `post-media` bucket, stores in `video_url`
- **Event button**: Opens a `CreateEventDialog`-style inline form (title, date, time, location, virtual toggle) that creates a post with category "event" and structured event details in the content
- **Write Article button**: Expands the editor with a title field and a larger rich-text area for long-form content, posted as category "article"
- The `onSubmit` signature will expand to accept `imageUrl` and `videoUrl` parameters

**3. Updated PostCard** (`src/components/dashboard/PostCard.tsx`)
- Render `video_url` as an HTML5 `<video>` player with controls when present
- Support the "article" category with a distinct visual treatment (larger title, read-more expandable content)

**4. Updated usePosts hook** (`src/hooks/usePosts.ts`)
- `createPost` accepts optional `imageUrl` and `videoUrl`
- `PostWithDetails` interface adds `video_url`

**5. Updated useHomeFeed hook** (`src/hooks/useHomeFeed.ts`)
- Include `video_url` in post fetching and `FeedItem` interface

**6. Create Opportunity Dialog** — New Component
- Create `src/components/opportunities/CreateOpportunityDialog.tsx`
- Form fields: title, description, type (grant/funding_call/accelerator/job), organization, amount, deadline, location, eligibility, tags
- Available from the Opportunities page header AND optionally from the home feed for investors
- Inserts into `opportunities` table with `created_by = user.id`

**7. OpportunitiesPage Update** (`src/components/opportunities/OpportunitiesPage.tsx`)
- Add a "Post Opportunity" button in the header visible to all authenticated users
- Opens the CreateOpportunityDialog

**8. Role-Agnostic Access**
- All features (photo, video, event, article posting; opportunity creation) work for any authenticated user regardless of role (startup_founder, investor, mentor, ecosystem_partner)

---

### Technical Details

**Storage Bucket Migration SQL:**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

CREATE POLICY "Anyone can view post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated users can upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE public.posts ADD COLUMN video_url text;

-- Allow any authenticated user to create opportunities
DROP POLICY IF EXISTS "Admins can create opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can create opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow creators to update/delete their own opportunities
DROP POLICY IF EXISTS "Admins can update opportunities" ON public.opportunities;
CREATE POLICY "Creators and admins can update opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete opportunities" ON public.opportunities;
CREATE POLICY "Creators and admins can delete opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
```

**Files to Create:**
- `src/components/opportunities/CreateOpportunityDialog.tsx`

**Files to Modify:**
- `src/components/dashboard/CreatePostCard.tsx` — add file upload, event form, article mode
- `src/components/dashboard/PostCard.tsx` — render video, article layout
- `src/hooks/usePosts.ts` — add video_url support
- `src/hooks/useHomeFeed.ts` — add video_url to FeedItem
- `src/components/dashboard/EcosystemFeed.tsx` — pass video support through
- `src/components/opportunities/OpportunitiesPage.tsx` — add "Post Opportunity" button

