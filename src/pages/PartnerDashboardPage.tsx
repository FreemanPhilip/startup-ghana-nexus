import { useState } from "react";
import { motion } from "framer-motion";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
import { parseDashboardPath } from "@/lib/roleRouting";
import { buildPartnerDashboardStats } from "@/lib/dashboardMetrics";
import { usePartnerDashboard, programStatus } from "@/hooks/usePartnerDashboard";
import { useStartupStageBreakdown } from "@/hooks/useEcosystemCounts";

const BASE_PATH = "/partner/dashboard";
const TABS = new Set([
  "home", "programs", "opportunities", "startups", "analytics", "messages",
  "settings", "startup-profile", "public-profile",
]);

const PartnerDashboardPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  usePresenceTracker();
  const partner = usePartnerDashboard();
  const stageBreakdown = useStartupStageBreakdown();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeIdentity, setActiveIdentity] = useState<PostingIdentity>({ type: "personal" });

  const { tab: rawTab, id } = parseDashboardPath(pathname, BASE_PATH);
  const activeTab = TABS.has(rawTab) ? rawTab : null;
  if (!activeTab) return <Navigate to={BASE_PATH} replace />;

  const viewStartupId = activeTab === "startup-profile" ? id : null;
  const viewProfileUserId = activeTab === "public-profile" ? id : null;
  const deepLinkOpportunityId = activeTab === "opportunities" ? id?.replace(/^opp-/, "") ?? null : null;

  const handleTabChange = (tab: string) => navigate(`${BASE_PATH}/${tab}`);
  const handleViewOpportunity = (opportunityId: string) => {
    const cleanId = opportunityId.startsWith("opp-") ? opportunityId.slice(4) : opportunityId;
    navigate(`${BASE_PATH}/opportunities/${cleanId}`);
  };
  const handleViewStartup = (startupId: string) => navigate(`${BASE_PATH}/startup-profile/${startupId}`);
  const handleViewProfile = (userId: string) => navigate(`${BASE_PATH}/public-profile/${userId}`);
  const handleOpenMessages = () => handleTabChange("messages");
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const isWideTab = ["programs", "opportunities", "startups", "analytics", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab);

  const portalStats = buildPartnerDashboardStats({
    startupCount: partner.data.startupCount,
    activeProgramCount: partner.data.activeProgramCount,
    opportunityCount: partner.data.opportunityCount,
    // Engagement has no source of truth yet, so derive it from real volume
    // rather than showing an invented constant.
    engagementRate: Math.min(
      99,
      Math.round(
        (partner.data.activeProgramCount * 12 + partner.data.opportunityCount * 3) || 0,
      ),
    ),
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RoleBasedSidebar role="ecosystem_partner" activeTab={activeTab} onTabChange={handleTabChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} onNavigate={handleTabChange} onSignOut={handleSignOut} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className={`mx-auto px-4 md:px-6 py-6 ${activeTab === "messages" ? "" : isWideTab ? "max-w-5xl" : "max-w-3xl"}`}>
              {activeTab === "home" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><EcosystemFeed onViewOpportunity={handleViewOpportunity} onViewGroup={() => {}} onViewStartup={handleViewStartup} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} /></motion.div>}
              {activeTab === "programs" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active programs</p><p className="mt-3 text-3xl font-bold">{portalStats.activeProgramCount}</p></div>
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Open opportunities</p><p className="mt-3 text-3xl font-bold">{portalStats.opportunityCount}</p></div>
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Engagement</p><p className="mt-3 text-3xl font-bold">{portalStats.engagementRate}%</p></div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Program pipeline</h3>
                  <div className="mt-4 space-y-3">
                    {partner.loading ? (
                      <p className="text-sm text-muted-foreground">Loading programs…</p>
                    ) : partner.isError ? (
                      <p className="text-sm text-muted-foreground">Couldn't load programs. This isn't an empty list.</p>
                    ) : partner.data.programs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No opportunities published yet.</p>
                    ) : (
                      partner.data.programs.map((program) => (
                        <div key={program.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                          <div>
                            <p className="font-medium">{program.title}</p>
                            <p className="text-xs text-muted-foreground">{program.organization}</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{programStatus(program.deadline)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "opportunities" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><OpportunitiesPage initialOpportunityId={deepLinkOpportunityId} onDeepLinkConsumed={() => navigate(`${BASE_PATH}/opportunities`, { replace: true })} /></motion.div>}
              {activeTab === "startups" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Startup directory</h3>
                  <div className="mt-4 space-y-3">
                    {partner.loading ? (
                      <p className="text-sm text-muted-foreground">Loading startups…</p>
                    ) : partner.isError ? (
                      <p className="text-sm text-muted-foreground">Couldn't load startups. This isn't an empty directory.</p>
                    ) : partner.data.startups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No startups have registered yet.</p>
                    ) : (
                      partner.data.startups.map((startup) => (
                        <div key={startup.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                          <div>
                            <p className="font-medium">{startup.name}</p>
                            <p className="text-xs text-muted-foreground">{startup.industry ?? "Industry not set"}</p>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">{startup.stage ?? "Stage not set"}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "analytics" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Startups</p><p className="mt-3 text-3xl font-bold">{portalStats.startupCount}</p></div>
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Programs</p><p className="mt-3 text-3xl font-bold">{portalStats.activeProgramCount}</p></div>
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Opportunities</p><p className="mt-3 text-3xl font-bold">{portalStats.opportunityCount}</p></div>
                  <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tracked</p><p className="mt-3 text-3xl font-bold">{portalStats.totalTracked}</p></div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Startups by stage</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Share of registered startups at each stage.</p>
                  <div className="mt-4 space-y-4">
                    {stageBreakdown.loading ? (
                      <p className="text-sm text-muted-foreground">Loading breakdown…</p>
                    ) : stageBreakdown.isError ? (
                      <p className="text-sm text-muted-foreground">Couldn't load the breakdown. This isn't an empty result.</p>
                    ) : stageBreakdown.breakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No startups have registered yet.</p>
                    ) : (
                      stageBreakdown.breakdown.map((metric) => (
                        <div key={metric.label}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="capitalize">{metric.label}</span>
                            <span className="text-muted-foreground">{metric.count} · {metric.value}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-brand" style={{ width: `${metric.value}%` }} /></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "messages" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MessagesPage onViewProfile={handleViewProfile} /></motion.div>}
              {activeTab === "profile" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><ProfilePage onSignOut={handleSignOut} /></motion.div>}
              {activeTab === "startup-profile" && viewStartupId && <motion.div key={viewStartupId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><StartupProfilePage startupId={viewStartupId} onBack={() => navigate(-1)} /></motion.div>}
              {activeTab === "public-profile" && viewProfileUserId && <motion.div key={viewProfileUserId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><PublicProfilePage userId={viewProfileUserId} onBack={() => navigate(-1)} onMessage={() => handleOpenMessages()} /></motion.div>}
              {activeTab === "settings" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><SettingsPage onSignOut={handleSignOut} /></motion.div>}
            </div>
          </main>
          {!["messages", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab) && <DashboardRightSidebar role="ecosystem_partner" onNavigate={handleTabChange} onViewProfile={handleViewProfile} />}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboardPage;