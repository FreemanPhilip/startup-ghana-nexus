import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getPostAuthRoute, getPrimaryDashboardRole, getRoleDashboardPath, sanitizeAppPath } from "@/lib/roleRouting";
import type { Database } from "@/integrations/supabase/types";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import TalentCallbackPage from "./pages/TalentCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import FounderDashboardPage from "./pages/FounderDashboardPage";
import InvestorDashboardPage from "./pages/InvestorDashboardPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminAuthPage from "./pages/AdminAuthPage";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";

const PostDetailPage = lazy(async () => {
  try {
    return await import("./pages/PostDetailPage");
  } catch {
    return { default: NotFound };
  }
});
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import StartupsIndexPage from "./pages/StartupsIndexPage";
import StartupDetailPage from "./pages/StartupDetailPage";
import SparkXIndexPage from "./pages/SparkXIndexPage";

// Shows text as well as a spinner: a bare spinner on a dark background is
// indistinguishable from a blank page, which makes "still loading" impossible
// to tell apart from "the app crashed" when something goes wrong.
const LoadingSpinner = ({ label = "Loading…" }: { label?: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const ProtectedRoute = ({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) => {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" replace />;
  if (requireOnboarding && profile && profile.onboarding_step !== "completed") {
    return <Navigate to={sanitizeAppPath("/onboarding")} replace />;
  }
  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, roles } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" replace />;
  // Only bounce out of onboarding when the user is actually done: admins go to
  // the admin dashboard, completed users with a dashboard role go to it.
  // Completed users with no dashboard role stay here so OnboardingPage can
  // send them back to role selection (avoiding a /dashboard redirect loop).
  const primary = getPrimaryDashboardRole(roles);
  if (primary) {
    if (profile && profile.onboarding_step === "completed") {
      return <Navigate to={sanitizeAppPath(getRoleDashboardPath(primary))} replace />;
    }
  }
  if (roles.includes("admin")) return <Navigate to={sanitizeAppPath("/admin/dashboard")} replace />;
  return <>{children}</>;
};

/** Guard that checks if the user has the correct role for a dashboard */
const RoleRoute = ({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) => {
  const { roles, loading, session, profile } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to={sanitizeAppPath("/auth")} replace />;
  // Admins skip onboarding check
  if (allowedRole !== "admin" && profile && profile.onboarding_step !== "completed") return <Navigate to={sanitizeAppPath("/onboarding")} replace />;
  const primary = getPrimaryDashboardRole(roles);
  if (!primary) {
    // No dashboard-capable role yet: send to onboarding (a terminal route)
    // instead of looping through the role-based dashboard redirect.
    return <Navigate to={sanitizeAppPath("/onboarding")} replace />;
  }
  if (!roles.includes(allowedRole as Database["public"]["Enums"]["app_role"])) {
    return <Navigate to={sanitizeAppPath(getRoleDashboardPath(primary))} replace />;
  }
  return <>{children}</>;
};

/** Smart redirect from /dashboard to the correct role-based dashboard */
const DashboardRedirect = () => {
  const { roles, loading, session, profile } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to={sanitizeAppPath("/auth")} replace />;
  return <Navigate to={sanitizeAppPath(getPostAuthRoute(roles, profile))} replace />;
};

const HomeOrDashboardRedirect = () => {
  const { session, profile, roles, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (session) return <Navigate to={sanitizeAppPath(getPostAuthRoute(roles, profile))} replace />;
  return <Index />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeOrDashboardRedirect />} />
            <Route path="/sparkx-talent" element={<ProductPage />} />
            <Route path="/sparkx-labs" element={<ProductPage />} />
            <Route path="/sparkx-advisory" element={<ProductPage />} />
            <Route path="/sparkx-academy" element={<ProductPage />} />
            <Route path="/sparkx-global" element={<ProductPage />} />
            <Route path="/sparkx-summit" element={<ProductPage />} />
            <Route path="/sparkx-fund" element={<ProductPage />} />
            <Route path="/sparkx-lounge" element={<ProductPage />} />
            <Route path="/sparkx-magazine" element={<ProductPage />} />
            <Route path="/sparkx-podcast" element={<ProductPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/startups" element={<StartupsIndexPage />} />
            <Route path="/startups/:slug" element={<StartupDetailPage />} />
            <Route path="/post/:postId" element={<Suspense fallback={<LoadingSpinner />}><PostDetailPage /></Suspense>} />
            <Route path="/sparkx-index" element={<SparkXIndexPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/talent/callback" element={<TalentCallbackPage />} />
            <Route path="/admin/login" element={<AdminAuthPage />} />
            <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
            
            {/* Shared dashboard entry: wait for auth state, then redirect to the correct role-aware dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            
            {/* Role-based dashboards — tabs and deep links live under each dashboard path */}
            <Route path="/founder/dashboard/*" element={<RoleRoute allowedRole="startup_founder"><FounderDashboardPage /></RoleRoute>} />
            <Route path="/investor/dashboard/*" element={<RoleRoute allowedRole="investor"><InvestorDashboardPage /></RoleRoute>} />
            <Route path="/mentor/dashboard/*" element={<RoleRoute allowedRole="mentor"><MentorDashboardPage /></RoleRoute>} />
            <Route path="/partner/dashboard/*" element={<RoleRoute allowedRole="ecosystem_partner"><PartnerDashboardPage /></RoleRoute>} />
            <Route path="/admin/dashboard/*" element={<RoleRoute allowedRole="admin"><AdminDashboardPage /></RoleRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
