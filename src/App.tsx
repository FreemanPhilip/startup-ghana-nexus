import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getRoleDashboardPath } from "@/lib/roleRouting";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import FounderDashboardPage from "./pages/FounderDashboardPage";
import InvestorDashboardPage from "./pages/InvestorDashboardPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminAuthPage from "./pages/AdminAuthPage";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import StartupsIndexPage from "./pages/StartupsIndexPage";
import StartupDetailPage from "./pages/StartupDetailPage";
import InvestorsIndexPage from "./pages/InvestorsIndexPage";
import InvestorDetailPage from "./pages/InvestorDetailPage";
import HowRankingWorksPage from "./pages/HowRankingWorksPage";



const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
  </div>
);

const ProtectedRoute = ({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) => {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" replace />;
  if (requireOnboarding && profile && profile.onboarding_step !== "completed") {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, roles } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" replace />;
  // Admins skip onboarding entirely
  if (roles.includes("admin")) return <Navigate to="/admin/dashboard" replace />;
  if (profile && profile.onboarding_step === "completed" && roles.length > 0) {
    return <Navigate to={getRoleDashboardPath(roles[0])} replace />;
  }
  return <>{children}</>;
};

/** Guard that checks if the user has the correct role for a dashboard */
const RoleRoute = ({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) => {
  const { roles, loading, session, profile } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" replace />;
  // Admins skip onboarding check
  if (allowedRole !== "admin" && profile && profile.onboarding_step !== "completed") return <Navigate to="/onboarding" replace />;
  if (!roles.includes(allowedRole as any)) {
    return <Navigate to={getRoleDashboardPath(roles[0])} replace />;
  }
  return <>{children}</>;
};

/** Smart redirect from /dashboard to the correct role-based dashboard */
const DashboardRedirect = () => {
  const { roles, loading, session, profile } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" replace />;
  // Admins skip onboarding
  if (!roles.includes("admin") && profile && profile.onboarding_step !== "completed") return <Navigate to="/onboarding" replace />;
  return <Navigate to={getRoleDashboardPath(roles[0])} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
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
            <Route path="/investors" element={<InvestorsIndexPage />} />
            <Route path="/investors/:slug" element={<InvestorDetailPage />} />
            <Route path="/how-ranking-works" element={<HowRankingWorksPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin/login" element={<AdminAuthPage />} />
            <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
            
            {/* Smart redirect for backward compat */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* Role-based dashboards */}
            <Route path="/founder/dashboard" element={<RoleRoute allowedRole="startup_founder"><FounderDashboardPage /></RoleRoute>} />
            <Route path="/investor/dashboard" element={<RoleRoute allowedRole="investor"><InvestorDashboardPage /></RoleRoute>} />
            <Route path="/mentor/dashboard" element={<RoleRoute allowedRole="mentor"><MentorDashboardPage /></RoleRoute>} />
            <Route path="/partner/dashboard" element={<RoleRoute allowedRole="ecosystem_partner"><PartnerDashboardPage /></RoleRoute>} />
            <Route path="/admin/dashboard" element={<RoleRoute allowedRole="admin"><AdminDashboardPage /></RoleRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
