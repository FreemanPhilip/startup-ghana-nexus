

## Plan: Role-Based Onboarding & Dashboard Routing

This is a large architectural change. I recommend breaking it into **3 phases** to avoid breaking the app.

### Phase 1: Revamp Onboarding Flow (3 steps instead of current 3)

**Current state:** Auth page → Onboarding (role → membership → profile) → single `/dashboard`

**New flow:**
1. Auth page gets role selection BEFORE signup (step 1 on the auth page itself)
2. After auth, onboarding is simplified to just: Full Name, Profile Picture, Location, Headline
3. Remove the membership step from onboarding (upgrade happens later from Settings)

**Changes:**
- **`src/pages/AuthPage.tsx`** — Add role selection screen as the first view. Store selected role in state. Pass it through auth metadata (`raw_user_meta_data.primary_role`). After signup/login, if onboarding incomplete → redirect to `/onboarding`
- **`src/pages/OnboardingPage.tsx`** — Simplify to single step: Full Name, Avatar upload, Location, Headline. On completion, read the role from `user_roles` table and redirect to the correct role-based route
- **`src/contexts/AuthContext.tsx`** — Add a `primaryRole` derived field from the first role in `roles[]` for easy routing
- **DB trigger update** — Modify `handle_new_user()` to also insert into `user_roles` if `raw_user_meta_data.primary_role` is present

**Database migration:**
```sql
-- Update handle_new_user to auto-assign role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  -- Auto-assign role if provided during signup
  IF NEW.raw_user_meta_data ->> 'primary_role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'primary_role')::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
```

### Phase 2: Role-Based Routes & Dashboard Layouts

**New route structure in `App.tsx`:**
- `/founder/dashboard` → `FounderDashboardPage`
- `/investor/dashboard` → `InvestorDashboardPage` (new layout)
- `/mentor/dashboard` → `MentorDashboardPage`
- `/partner/dashboard` → `PartnerDashboardPage`
- `/dashboard` → redirect based on role (backward compat)

**New files to create:**
- `src/pages/FounderDashboardPage.tsx` — Wraps existing `DashboardPage` logic with founder sidebar
- `src/pages/InvestorDashboardPage.tsx` — New layout with investor-specific sidebar
- `src/pages/MentorDashboardPage.tsx` — New layout with mentor-specific sidebar
- `src/pages/PartnerDashboardPage.tsx` — New layout with partner-specific sidebar
- `src/components/dashboard/RoleBasedSidebar.tsx` — A single sidebar component that renders different nav items based on role prop

**Route guard (`RoleRoute` component):**
```tsx
const RoleRoute = ({ allowedRole, children }) => {
  const { roles } = useAuth();
  if (!roles.includes(allowedRole)) {
    // Redirect to correct dashboard
    return <Navigate to={getRoleDashboardPath(roles[0])} replace />;
  }
  return children;
};
```

**Each role's sidebar items:**

| Founder | Investor | Mentor | Partner |
|---------|----------|--------|---------|
| Home | Home | Home | Home |
| My Network | Discover Startups | My Sessions | Programs |
| Groups | Saved Startups | Availability | Opportunities |
| Messages | Messages | Messages | Startups |
| Mentors | Portfolio | Reviews | Analytics |
| My Sessions | Settings | Settings | Settings |
| Investors | | | |
| Opportunities | | | |
| My Startups | | | |
| Settings | | | |

### Phase 3: Access Control & Polish

- Each role dashboard page only renders role-relevant content tabs
- `ProtectedRoute` updated to check role and redirect accordingly
- Old `/dashboard` route becomes a smart redirect
- Founder dashboard shows "Startup Setup" prompt if no startups exist
- Remove `service_provider` and `member` from the role selection UI (keep in DB enum for backward compat, map them to nearest role)

### Implementation Order (recommended)

1. DB migration (update `handle_new_user` trigger)
2. Update `AuthPage.tsx` with role selection pre-auth
3. Simplify `OnboardingPage.tsx`
4. Create role-specific sidebar config
5. Create 4 dashboard page wrappers
6. Update `App.tsx` routes with role guards
7. Update `AuthContext` with `primaryRole` helper

### Note on LinkedIn Auth
LinkedIn OAuth is **not supported** in Lovable Cloud. Only Google and Email+Password will be available. The LinkedIn option from the user's spec will be omitted.

