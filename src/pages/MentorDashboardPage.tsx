import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import RoleBasedSidebar from "@/components/dashboard/RoleBasedSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRightSidebar from "@/components/dashboard/DashboardRightSidebar";
import EcosystemFeed from "@/components/dashboard/EcosystemFeed";
import MySessionsPage from "@/components/mentorship/MySessionsPage";
import MentorAvailabilityManager from "@/components/mentorship/MentorAvailabilityManager";
import MenteeCirclePage from "@/components/mentorship/MenteeCirclePage";
import MessagesPage from "@/components/messages/MessagesPage";
import ProfilePage from "@/components/profile/ProfilePage";
import PublicProfilePage from "@/components/profile/PublicProfilePage";
import SettingsPage from "@/components/settings/SettingsPage";
import type { PostingIdentity } from "@/components/dashboard/AvatarDropdown";
import { buildMentorReviewSummary } from "@/lib/dashboardMetrics";

const MentorDashboardPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  usePresenceTracker();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);
  const navHistoryRef = useRef<string[]>(["home"]);
  const [activeIdentity, setActiveIdentity] = useState<PostingIdentity>({ type: "personal" });

  const goBack = useCallback(() => {
    const history = navHistoryRef.current;
    if (history.length > 1) {
      history.pop();
      const prev = history[history.length - 1];
      setActiveTab(prev);
      if (prev !== "public-profile") setViewProfileUserId(null);
    } else setActiveTab("home");
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    setViewProfileUserId(userId);
    navHistoryRef.current.push("public-profile");
    setActiveTab("public-profile");
  }, []);

  const handleOpenMessages = useCallback(() => handleTabChange("messages"), []);
  const handleSignOut = useCallback(async () => { await signOut(); navigate("/"); }, [signOut, navigate]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab !== "public-profile") setViewProfileUserId(null);
    const history = navHistoryRef.current;
    if (history[history.length - 1] !== tab) history.push(tab);
    setActiveTab(tab);
  }, []);

  const isWideTab = ["mentees", "my-sessions", "availability", "reviews", "profile", "public-profile", "settings"].includes(activeTab);

  const mentorReviews = [
    { rating: 5, reviewerName: "Amina K.", comment: "Clear action plan and strong founder coaching.", created_at: "2026-09-12T09:00:00Z" },
    { rating: 4, reviewerName: "Kofi T.", comment: "Very practical and encouraging during the growth sprint.", created_at: "2026-09-09T09:00:00Z" },
    { rating: 5, reviewerName: "Lina M.", comment: "Helpful feedback on pitching, roadmap, and product priorities.", created_at: "2026-09-04T09:00:00Z" },
  ];
  const reviewSummary = buildMentorReviewSummary(mentorReviews);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <RoleBasedSidebar role="mentor" activeTab={activeTab} onTabChange={handleTabChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} onNavigate={handleTabChange} onSignOut={handleSignOut} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className={`mx-auto px-4 md:px-6 py-6 ${activeTab === "messages" ? "" : isWideTab ? "max-w-5xl" : "max-w-3xl"}`}>
              {activeTab === "home" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><EcosystemFeed onViewOpportunity={() => {}} onViewGroup={() => {}} onViewStartup={() => {}} activeIdentity={activeIdentity} onIdentityChange={setActiveIdentity} /></motion.div>}
              {activeTab === "mentees" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MenteeCirclePage /></motion.div>}
              {activeTab === "my-sessions" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MySessionsPage /></motion.div>}
              {activeTab === "availability" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MentorAvailabilityManager /></motion.div>}
              {activeTab === "messages" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><MessagesPage onViewProfile={handleViewProfile} /></motion.div>}
              {activeTab === "reviews" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Average rating</p>
                    <p className="mt-3 text-3xl font-bold">{reviewSummary.averageRating.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total reviews</p>
                    <p className="mt-3 text-3xl font-bold">{reviewSummary.totalReviews}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">5-star feedback</p>
                    <p className="mt-3 text-3xl font-bold">{reviewSummary.fiveStarCount}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-xl font-bold">Recent feedback</h3>
                  <div className="mt-4 space-y-4">
                    {mentorReviews.map((review) => (
                      <div key={`${review.reviewerName}-${review.created_at}`} className="rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{review.reviewerName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="rounded-full bg-amber-500/10 px-2 py-1 text-sm font-medium text-amber-600">
                            {"★".repeat(review.rating)}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>}
              {activeTab === "profile" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><ProfilePage onSignOut={handleSignOut} /></motion.div>}
              {activeTab === "public-profile" && viewProfileUserId && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><PublicProfilePage userId={viewProfileUserId} onBack={goBack} onMessage={() => handleOpenMessages()} /></motion.div>}
              {activeTab === "settings" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><SettingsPage onSignOut={handleSignOut} /></motion.div>}
            </div>
          </main>
          {!["messages", "profile", "public-profile", "settings", "my-sessions", "availability"].includes(activeTab) && <DashboardRightSidebar onNavigate={handleTabChange} />}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboardPage;
