

## Problem

The current flow has two issues:

1. **Google OAuth always redirects to `/onboarding`** (line 57 in AuthPage.tsx: `redirect_uri` points to `/onboarding`), so even existing users hit the onboarding wizard after Google sign-in.
2. **`OnboardingRoute` guard** only skips onboarding if `onboarding_step === "completed"` AND `roles.length > 0`. But `ProtectedRoute` and `RoleRoute` both redirect incomplete profiles to `/onboarding` -- so existing users with `completed` status work fine, but the Google redirect is wrong.
3. **Email sign-in** correctly navigates to `/dashboard` (line 43), which then redirects to the role-based dashboard. This path works.

The core fix: Google OAuth should redirect to `/dashboard` (the smart redirect), not `/onboarding`. The `DashboardRedirect` and `RoleRoute` guards already handle incomplete onboarding by redirecting to `/onboarding`. So the routing logic is actually correct for existing users -- the only bug is the Google OAuth redirect URL.

Additionally, the `AuthPage` itself doesn't redirect authenticated users away -- if an existing user lands on `/auth`, they stay there. We should add a guard.

## Plan

### 1. Fix Google OAuth redirect (AuthPage.tsx)
Change `redirect_uri` from `/onboarding` to `/dashboard`. The `DashboardRedirect` component already checks onboarding status and redirects new users to `/onboarding` if incomplete.

### 2. Add auth guard to AuthPage (AuthPage.tsx)
If a user is already authenticated with a completed profile, redirect them to `/dashboard` instead of showing the auth form. This prevents existing users from seeing auth/onboarding screens.

### 3. Fix email sign-up redirect (AuthPage.tsx)
Change the sign-up success redirect from `/onboarding` to `/dashboard` for consistency. The `DashboardRedirect` will handle routing new users to onboarding.

### Files Changed
- **`src/pages/AuthPage.tsx`**: Change Google redirect_uri to `/dashboard`, add redirect for already-authenticated users, unify sign-up redirect to `/dashboard`.

No database changes needed. The `onboarding_step` enum and routing guards already handle the new-vs-existing user distinction correctly.

