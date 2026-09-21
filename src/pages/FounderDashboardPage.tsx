import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useSessionReminders } from "@/hooks/useSessionReminders";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import RoleBasedSidebar from "@/components/dashboard/RoleBasedSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRightSidebar from "@/components/dashboard/DashboardRightSidebar";
import EcosystemFeed from "@/components/dashboard/EcosystemFeed";
import MentorsPage from "@/components/mentorship/MentorsPage";
import InvestorsPage from "@/components/investors/InvestorsPage";
import InvestorRightSidebar from "@/components/investors/InvestorRightSidebar";
import NetworkPage from "@/components/network/NetworkPage";
import OpportunitiesPage from "@/components/opportunities/OpportunitiesPage";
import MessagesPage from "@/components/messages/MessagesPage";
import GroupsPage from "@/components/groups/GroupsPage";
import ProfilePage from "@/components/profile/ProfilePage";
import MyStartupsPage from "@/components/startups/MyStartupsPage";
import StartupProfilePage from "@/components/startups/StartupProfilePage";
import FirstTimeFounderModal from "@/components/startups/FirstTimeFounderModal";
import MySessionsPage from "@/components/mentorship/MySessionsPage";
import MentorBriefingPage from "@/components/mentorship/MentorBriefingPage";
import PublicProfilePage from "@/components/profile/PublicProfilePage";
import CreateStartupWizard from "@/components/startups/CreateStartupWizard";
import SettingsPage from "@/components/settings/SettingsPage";
import type { PostingIdentity } from "@/components/dashboard/AvatarDropdown";
import { useStartups } from "@/hooks/useStartups";
import { buildFounderDashboardSummary } from "@/lib/dashboardMetrics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FounderDashboardPage = () => {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  usePresenceTracker();
  useSessionReminders();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deepLinkOpportunityId, setDeepLinkOpportunityId] = useState<string | null>(null);
  const [deepLinkGroupId, setDeepLinkGroupId] = useState<string | null>(null);
  const [viewStartupId, setViewStartupId] = useState<string | null>(null);
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);
  const navHistoryRef = useRef<string[]>(["home"]);
  const [activeIdentity, setActiveIdentity] = useState<PostingIdentity>({ type: "personal" });
  const { myStartups, loading: startupsLoading, refetch: refetchStartups } = useStartups();
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [founderModalShown, setFounderModalShown] = useState(false);

  useEffect(() => {
    if (!startupsLoading && !founderModalShown && myStartups.length === 0) {
      setShowFounderModal(true);
      setFounderModalShown(true);
    }
  }, [startupsLoading, myStartups.length, founderModalShown]);

  const goBack = useCallback(() => {
    const history = navHistoryRef.current;
    if (history.length > 1) {
      history.pop();
      const prev = history[history.length - 1];
      setActiveTab(prev);
      if (prev !== "startup-profile") setViewStartupId(null);
      if (prev !== "public-profile") setViewProfileUserId(null);
    } else {
      setActiveTab("home");
    }
  }, []);

  const handleViewOpportunity = useCallback((opportunityId: string) => {
    const cleanId = opportunityId.startsWith("opp-") ? opportunityId.slice(4) : opportunityId;
    setDeepLinkOpportunityId(cleanId);
    handleTabChange("opportunities");
  }, []);

  const handleViewGroup = useCallback((groupId: string) => {
    setDeepLinkGroupId(groupId);
    handleTabChange("groups");
  }, []);

  const handleViewStartup = useCallback((startupId: string) => {
    setViewStartupId(startupId);
    navHistoryRef.current.push("startup-profile");
    setActiveTab("startup-profile");
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    setViewProfileUserId(userId);
    navHistoryRef.current.push("public-profile");
    setActiveTab("public-profile");
  }, []);

  const handleOpenMessages = useCallback(() => { handleTabChange("messages"); }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab !== "opportunities") setDeepLinkOpportunityId(null);
    if (tab !== "groups") setDeepLinkGroupId(null);
    if (tab !== "startup-profile") setViewStartupId(null);
    if (tab !== "public-profile") setViewProfileUserId(null);
    const history = navHistoryRef.current;
    if (history[history.length - 1] !== tab) {
      history.push(tab);
      if (history.length > 20) history.splice(0, history.length - 20);
    }
    setActiveTab(tab);
  }, []);

  const isWideTab = ["mentors", "investors", "network", "opportunities", "groups", "profile", "my-startups", "startup-profile", "mentor-briefing", "my-sessions", "public-profile", "settings"].includes(activeTab);
  const founderSummary = buildFounderDashboardSummary({ startupCount: myStartups.length, mentorConnections: 0, opportunityCount: 0 });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RoleBasedSidebar
        role="startup_founder"
        activeTab={activeTab}
        onTabChange={handleTabChange}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader
          onMenuToggle={() => setSidebarOpen(true)}
          onNavigate={handleTabChange}
          onSignOut={handleSignOut}
          activeIdentity={activeIdentity}
          onIdentityChange={setActiveIdentity}
        />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className={`mx-auto px-4 md:px-6 py-6 ${activeTab === "messages" ? "" : isWideTab ? "max-w-5xl" : "max-w-3xl"}`}>
              <Card className="mb-6 p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Founder snapshot</p>
                    <h2 className="mt-1 font-display text-xl font-bold">{founderSummary.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{founderSummary.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                      {founderSummary.readiness}% readiness
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-gold text-navy hover:opacity-90"
                      onClick={() => (myStartups.length > 0 ? handleTabChange("my-startups") : setShowWizard(true))}
                    >
                      {founderSummary.actionLabel}
                    </Button>
                  </div>
                </div>
              </Card>
              {activeTab === "home" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><EcosystemFeed onViewOpportunity={handleViewOpportunity} onViewGroup={handleViewGroup} onViewStartup={handleViewStartup} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} /></motion.div>}
              {activeTab === "messages" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MessagesPage onViewProfile={handleViewProfile} /></motion.div>}
              {activeTab === "network" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><NetworkPage onOpenMessages={handleOpenMessages} /></motion.div>}
              {activeTab === "mentors" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MentorsPage onOpenMessages={handleOpenMessages} /></motion.div>}
              {activeTab === "mentor-briefing" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MentorBriefingPage /></motion.div>}
              {activeTab === "my-sessions" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MySessionsPage /></motion.div>}
              {activeTab === "investors" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><InvestorsPage onViewStartup={handleViewStartup} /></motion.div>}
              {activeTab === "opportunities" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><OpportunitiesPage initialOpportunityId={deepLinkOpportunityId} onDeepLinkConsumed={() => setDeepLinkOpportunityId(null)} /></motion.div>}
              {activeTab === "groups" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><GroupsPage initialGroupId={deepLinkGroupId} onDeepLinkConsumed={() => setDeepLinkGroupId(null)} /></motion.div>}
              {activeTab === "profile" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><ProfilePage onSignOut={handleSignOut} /></motion.div>}
              {activeTab === "my-startups" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MyStartupsPage onViewStartup={handleViewStartup} /></motion.div>}
              {activeTab === "startup-profile" && viewStartupId && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><StartupProfilePage startupId={viewStartupId} onBack={goBack} /></motion.div>}
              {activeTab === "public-profile" && viewProfileUserId && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><PublicProfilePage userId={viewProfileUserId} onBack={goBack} onMessage={() => handleOpenMessages()} /></motion.div>}
              {activeTab === "settings" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><SettingsPage onSignOut={handleSignOut} /></motion.div>}
            </div>
          </main>
          {!["messages", "groups", "profile", "my-startups", "startup-profile", "mentor-briefing", "my-sessions", "public-profile", "settings"].includes(activeTab) && (activeTab === "investors" ? <InvestorRightSidebar onViewInvestor={() => {}} /> : <DashboardRightSidebar onNavigate={handleTabChange} />)}
        </div>
      </div>
      <FirstTimeFounderModal open={showFounderModal} onOpenChange={setShowFounderModal} onCreateStartup={() => setShowWizard(true)} />
      <CreateStartupWizard open={showWizard} onOpenChange={setShowWizard} onCreated={refetchStartups} />
    </div>
  );
};

export default FounderDashboardPage;
