import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

vi.mock("./pages/Index", () => ({ default: () => <div>Index Page</div> }));
vi.mock("./pages/AuthPage", () => ({ default: () => <div>Auth Page</div> }));
vi.mock("./pages/TalentCallbackPage", () => ({ default: () => <div>Talent Callback Page</div> }));
vi.mock("./pages/OnboardingPage", () => ({ default: () => <div>Onboarding Page</div> }));
vi.mock("./pages/DashboardPage", () => ({ default: () => <div>Shared Dashboard</div> }));
vi.mock("./pages/FounderDashboardPage", () => ({ default: () => <div>Founder Dashboard</div> }));
vi.mock("./pages/InvestorDashboardPage", () => ({ default: () => <div>Investor Dashboard</div> }));
vi.mock("./pages/MentorDashboardPage", () => ({ default: () => <div>Mentor Dashboard</div> }));
vi.mock("./pages/PartnerDashboardPage", () => ({ default: () => <div>Partner Dashboard</div> }));
vi.mock("./pages/AdminDashboardPage", () => ({ default: () => <div>Admin Dashboard</div> }));
vi.mock("./pages/AdminAuthPage", () => ({ default: () => <div>Admin Auth Page</div> }));
vi.mock("./pages/NotFound", () => ({ default: () => <div>Not Found</div> }));
vi.mock("./pages/ProductPage", () => ({ default: () => <div>Product Page</div> }));
vi.mock("./pages/AboutPage", () => ({ default: () => <div>About Page</div> }));
vi.mock("./pages/ContactPage", () => ({ default: () => <div>Contact Page</div> }));
vi.mock("./pages/StartupsIndexPage", () => ({ default: () => <div>Startups Page</div> }));
vi.mock("./pages/StartupDetailPage", () => ({ default: () => <div>Startup Detail</div> }));
vi.mock("./pages/SparkXIndexPage", () => ({ default: () => <div>SparkX Index</div> }));

describe("App routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/dashboard");
    mockUseAuth.mockReturnValue({
      session: { user: { id: "user-123" } },
      user: { id: "user-123" },
      profile: { onboarding_step: "completed" },
      roles: ["startup_founder"],
      loading: false,
      primaryRole: "startup_founder",
      subscription: { subscribed: false, product_id: null, subscription_end: null },
      isPremium: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
      checkSubscription: vi.fn(),
    });
  });

  it("routes authenticated users from the shared dashboard to their role-specific dashboard", () => {
    render(<App />);

    expect(screen.getByText("Founder Dashboard")).toBeTruthy();
  });
});
