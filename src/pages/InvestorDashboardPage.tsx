import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import RoleBasedSidebar from "@/components/dashboard/RoleBasedSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRightSidebar from "@/components/dashboard/DashboardRightSidebar";
import EcosystemFeed from "@/components/dashboard/EcosystemFeed";
import InvestorDashboardContent from "@/components/investors/InvestorDashboardPage";
import InvestorsPage from "@/components/investors/InvestorsPage";
import MessagesPage from "@/components/messages/MessagesPage";
import ProfilePage from "@/components/profile/ProfilePage";
import PublicProfilePage from "@/components/profile/PublicProfilePage";
import StartupProfilePage from "@/components/startups/StartupProfilePage";
import SettingsPage from "@/components/settings/SettingsPage";
import type { PostingIdentity } from "@/components/dashboard/AvatarDropdown";
import { parseDashboardPath } from "@/lib/roleRouting";
import { buildInvestorDashboardSummary } from "@/lib/dashboardMetrics";
import { useInvestorTracking } from "@/hooks/useInvestorTracking";
import { useConnections } from "@/hooks/useConnections";

const BASE_PATH = "/investor/dashboard";
const TABS = new Set([
  "home", "discover", "saved", "portfolio", "messages", "settings",
  "startup-profile", "public-profile",
]);

const InvestorDashboardPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  usePresenceTracker();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeIdentity, setActiveIdentity] = useState<PostingIdentity>({ type: "personal" });
  const { shortlisted } = useInvestorTracking();
  const { pendingSent, connections } = useConnections();

  const { tab: rawTab, id } = parseDashboardPath(pathname, BASE_PATH);
  const activeTab = TABS.has(rawTab) ? rawTab : null;
  if (!activeTab) return <Navigate to={BASE_PATH} replace />;

  const viewStartupId = activeTab === "startup-profile" ? id : null;
  const viewProfileUserId = activeTab === "public-profile" ? id : null;

  const handleTabChange = (tab: string) => navigate(`${BASE_PATH}/${tab}`);
  const handleViewStartup = (startupId: string) => navigate(`${BASE_PATH}/startup-profile/${startupId}`);
  const handleViewProfile = (userId: string) => navigate(`${BASE_PATH}/public-profile/${userId}`);
  const handleOpenMessages = () => handleTabChange("messages");
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const isWideTab = ["discover", "saved", "portfolio", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab);
  const investorSummary = buildInvestorDashboardSummary({
    savedStartups: shortlisted.length,
    pendingRequests: pendingSent.length,
    portfolioCount: connections.size,
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RoleBasedSidebar role="investor" activeTab={activeTab} onTabChange={handleTabChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} onNavigate={handleTabChange} onSignOut={handleSignOut} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className={`mx-auto px-4 md:px-6 py-6 ${activeTab === "messages" ? "" : isWideTab ? "max-w-5xl" : "max-w-3xl"}`}>
              <Card className="mb-6 p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Investor snapshot</p>
                    <h2 className="mt-1 font-display text-xl font-bold">{investorSummary.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{investorSummary.description}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-gold text-white hover:opacity-90"
                    onClick={() => handleTabChange("discover")}
                  >
                    {investorSummary.actionLabel}
                  </Button>
                </div>
              </Card>
              {activeTab === "home" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><EcosystemFeed onViewOpportunity={() => {}} onViewGroup={() => {}} onViewStartup={handleViewStartup} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} /></motion.div>}
              {activeTab === "discover" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><InvestorsPage onViewStartup={handleViewStartup} /></motion.div>}
              {activeTab === "saved" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><InvestorDashboardContent /></motion.div>}
              {activeTab === "portfolio" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><InvestorDashboardContent /></motion.div>}
              {activeTab === "messages" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MessagesPage onViewProfile={handleViewProfile} /></motion.div>}
              {activeTab === "profile" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><ProfilePage onSignOut={handleSignOut} /></motion.div>}
              {activeTab === "startup-profile" && viewStartupId && <motion.div key={viewStartupId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><StartupProfilePage startupId={viewStartupId} onBack={() => navigate(-1)} /></motion.div>}
              {activeTab === "public-profile" && viewProfileUserId && <motion.div key={viewProfileUserId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><PublicProfilePage userId={viewProfileUserId} onBack={() => navigate(-1)} onMessage={() => handleOpenMessages()} /></motion.div>}
              {activeTab === "settings" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><SettingsPage onSignOut={handleSignOut} /></motion.div>}
            </div>
          </main>
          {!["messages", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab) && <DashboardRightSidebar onNavigate={handleTabChange} />}
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboardPage;