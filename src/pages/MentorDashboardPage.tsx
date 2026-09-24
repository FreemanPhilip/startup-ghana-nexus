import { useState } from "react";
import { motion } from "framer-motion";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
import { parseDashboardPath } from "@/lib/roleRouting";
import { buildMentorReviewSummary } from "@/lib/dashboardMetrics";

const BASE_PATH = "/mentor/dashboard";
const TABS = new Set([
  "home", "mentees", "my-sessions", "availability", "messages", "reviews",
  "settings", "public-profile",
]);

const MentorDashboardPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  usePresenceTracker();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeIdentity, setActiveIdentity] = useState<PostingIdentity>({ type: "personal" });

  const { tab: rawTab, id } = parseDashboardPath(pathname, BASE_PATH);
  const activeTab = TABS.has(rawTab) ? rawTab : null;
  if (!activeTab) return <Navigate to={BASE_PATH} replace />;

  const viewProfileUserId = activeTab === "public-profile" ? id : null;

  const handleTabChange = (tab: string) => navigate(`${BASE_PATH}/${tab}`);
  const handleViewProfile = (userId: string) => navigate(`${BASE_PATH}/public-profile/${userId}`);
  const handleOpenMessages = () => handleTabChange("messages");
  const handleSignOut = async () => { await signOut(); navigate("/"); };

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
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Average rating</p>
                    <p className="mt-3 text-3xl font-bold">{reviewSummary.averageRating.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total reviews</p>
                    <p className="mt-3 text-3xl font-bold">{reviewSummary.totalReviews}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">5-star feedback</p>
                    <p className="mt-3 text-3xl font-bold">{reviewSummary.fiveStarCount}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
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
              {activeTab === "public-profile" && viewProfileUserId && <motion.div key={viewProfileUserId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><PublicProfilePage userId={viewProfileUserId} onBack={() => navigate(-1)} onMessage={() => handleOpenMessages()} /></motion.div>}
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