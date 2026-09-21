import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import RoleBasedSidebar from "@/components/dashboard/RoleBasedSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRightSidebar from "@/components/dashboard/DashboardRightSidebar";
import EcosystemFeed from "@/components/dashboard/EcosystemFeed";
import OpportunitiesPage from "@/components/opportunities/OpportunitiesPage";
import MessagesPage from "@/components/messages/MessagesPage";
import ProfilePage from "@/components/profile/ProfilePage";
import PublicProfilePage from "@/components/profile/PublicProfilePage";
import StartupProfilePage from "@/components/startups/StartupProfilePage";
import SettingsPage from "@/components/settings/SettingsPage";
import type { PostingIdentity } from "@/components/dashboard/AvatarDropdown";
import { buildPartnerDashboardStats } from "@/lib/dashboardMetrics";

const PartnerDashboardPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  usePresenceTracker();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewStartupId, setViewStartupId] = useState<string | null>(null);
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);
  const [deepLinkOpportunityId, setDeepLinkOpportunityId] = useState<string | null>(null);
  const navHistoryRef = useRef<string[]>(["home"]);
  const [activeIdentity, setActiveIdentity] = useState<PostingIdentity>({ type: "personal" });

  const goBack = useCallback(() => {
    const history = navHistoryRef.current;
    if (history.length > 1) {
      history.pop();
      const prev = history[history.length - 1];
      setActiveTab(prev);
      if (prev !== "startup-profile") setViewStartupId(null);
      if (prev !== "public-profile") setViewProfileUserId(null);
    } else setActiveTab("home");
  }, []);

  const handleViewStartup = useCallback((id: string) => {
    setViewStartupId(id);
    navHistoryRef.current.push("startup-profile");
    setActiveTab("startup-profile");
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    setViewProfileUserId(userId);
    navHistoryRef.current.push("public-profile");
    setActiveTab("public-profile");
  }, []);

  const handleOpenMessages = useCallback(() => handleTabChange("messages"), []);
  const handleSignOut = useCallback(async () => { await signOut(); navigate("/"); }, [signOut, navigate]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab !== "opportunities") setDeepLinkOpportunityId(null);
    if (tab !== "startup-profile") setViewStartupId(null);
    if (tab !== "public-profile") setViewProfileUserId(null);
    const history = navHistoryRef.current;
    if (history[history.length - 1] !== tab) history.push(tab);
    setActiveTab(tab);
  }, []);

  const isWideTab = ["programs", "opportunities", "startups", "analytics", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab);

  const portalStats = buildPartnerDashboardStats({
    startupCount: 42,
    activeProgramCount: 7,
    opportunityCount: 18,
    engagementRate: 81,
  });
  const programHighlights = [
    { name: "Seed Capital Bootcamp", cohort: "Cohort 5", status: "Open" },
    { name: "Founder Growth Sprint", cohort: "West Africa", status: "Live" },
    { name: "Investor Matchmaking", cohort: "Q4 2026", status: "Scheduled" },
  ];
  const startupDirectory = [
    { name: "Sankofa Health", stage: "Seed", industry: "HealthTech" },
    { name: "AgriPulse", stage: "Series A", industry: "AgriTech" },
    { name: "BlueLight Fintech", stage: "Pre-Seed", industry: "FinTech" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RoleBasedSidebar role="ecosystem_partner" activeTab={activeTab} onTabChange={handleTabChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} onNavigate={handleTabChange} onSignOut={handleSignOut} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className={`mx-auto px-4 md:px-6 py-6 ${activeTab === "messages" ? "" : isWideTab ? "max-w-5xl" : "max-w-3xl"}`}>
              {activeTab === "home" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><EcosystemFeed onViewOpportunity={(id) => { setDeepLinkOpportunityId(id); handleTabChange("opportunities"); }} onViewGroup={() => {}} onViewStartup={handleViewStartup} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} /></motion.div>}
              {activeTab === "programs" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active programs</p><p className="mt-3 text-3xl font-bold">{portalStats.activeProgramCount}</p></div>
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Open opportunities</p><p className="mt-3 text-3xl font-bold">{portalStats.opportunityCount}</p></div>
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Engagement</p><p className="mt-3 text-3xl font-bold">{portalStats.engagementRate}%</p></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Program pipeline</h3>
                  <div className="mt-4 space-y-3">
                    {programHighlights.map((program) => (
                      <div key={program.name} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-xs text-muted-foreground">{program.cohort}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{program.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "opportunities" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><OpportunitiesPage initialOpportunityId={deepLinkOpportunityId} onDeepLinkConsumed={() => setDeepLinkOpportunityId(null)} /></motion.div>}
              {activeTab === "startups" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Startup directory</h3>
                  <div className="mt-4 space-y-3">
                    {startupDirectory.map((startup) => (
                      <div key={startup.name} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                        <div>
                          <p className="font-medium">{startup.name}</p>
                          <p className="text-xs text-muted-foreground">{startup.industry}</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">{startup.stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "analytics" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Startups</p><p className="mt-3 text-3xl font-bold">{portalStats.startupCount}</p></div>
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Programs</p><p className="mt-3 text-3xl font-bold">{portalStats.activeProgramCount}</p></div>
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Opportunities</p><p className="mt-3 text-3xl font-bold">{portalStats.opportunityCount}</p></div>
                  <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tracked</p><p className="mt-3 text-3xl font-bold">{portalStats.totalTracked}</p></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Ecosystem momentum</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { label: "Fundraising readiness", value: 88 },
                      { label: "Investor interest", value: 76 },
                      { label: "Mentor engagement", value: 83 },
                      { label: "Program conversion", value: 71 },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-1 flex items-center justify-between text-sm"><span>{metric.label}</span><span>{metric.value}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-gold" style={{ width: `${metric.value}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "messages" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MessagesPage onViewProfile={handleViewProfile} /></motion.div>}
              {activeTab === "profile" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><ProfilePage onSignOut={handleSignOut} /></motion.div>}
              {activeTab === "startup-profile" && viewStartupId && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><StartupProfilePage startupId={viewStartupId} onBack={goBack} /></motion.div>}
              {activeTab === "public-profile" && viewProfileUserId && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><PublicProfilePage userId={viewProfileUserId} onBack={goBack} onMessage={() => handleOpenMessages()} /></motion.div>}
              {activeTab === "settings" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><SettingsPage onSignOut={handleSignOut} /></motion.div>}
            </div>
          </main>
          {!["messages", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab) && <DashboardRightSidebar onNavigate={handleTabChange} />}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboardPage;
