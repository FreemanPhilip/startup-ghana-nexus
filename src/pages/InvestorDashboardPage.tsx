import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import RoleBasedSidebar from "@/components/dashboard/RoleBasedSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRightSidebar from "@/components/dashboard/DashboardRightSidebar";
import EcosystemFeed from "@/components/dashboard/EcosystemFeed";
import InvestorDashboardContent from "@/components/investors/InvestorDashboardPage";
import InvestorsPage from "@/components/investors/InvestorsPage";
import InvestorRightSidebar from "@/components/investors/InvestorRightSidebar";
import MessagesPage from "@/components/messages/MessagesPage";
import ProfilePage from "@/components/profile/ProfilePage";
import PublicProfilePage from "@/components/profile/PublicProfilePage";
import StartupProfilePage from "@/components/startups/StartupProfilePage";
import SettingsPage from "@/components/settings/SettingsPage";
import type { PostingIdentity } from "@/components/dashboard/AvatarDropdown";
import { buildInvestorDashboardSummary } from "@/lib/dashboardMetrics";

const InvestorDashboardPageRoute = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  usePresenceTracker();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewStartupId, setViewStartupId] = useState<string | null>(null);
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);
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
    if (tab !== "startup-profile") setViewStartupId(null);
    if (tab !== "public-profile") setViewProfileUserId(null);
    const history = navHistoryRef.current;
    if (history[history.length - 1] !== tab) history.push(tab);
    setActiveTab(tab);
  }, []);

  const isWideTab = ["discover", "saved", "portfolio", "profile", "startup-profile", "public-profile", "settings"].includes(activeTab);
  const investorSummary = buildInvestorDashboardSummary({
    savedStartups: 0,
    pendingRequests: 0,
    portfolioCount: 0,
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
                    className="bg-gradient-gold text-navy hover:opacity-90"
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

export default InvestorDashboardPageRoute;
