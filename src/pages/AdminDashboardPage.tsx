import { useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminMentorAssignments from "@/components/admin/AdminMentorAssignments";
import AdminStartupsTable from "@/components/admin/AdminStartupsTable";
import AdminContactSubmissions from "@/components/admin/AdminContactSubmissions";
import AdminRecentActivity from "@/components/admin/AdminRecentActivity";
import AdminRoleDistribution from "@/components/admin/AdminRoleDistribution";
import AdminVerificationRequests from "@/components/admin/AdminVerificationRequests";
import AdminPostsTable from "@/components/admin/AdminPostsTable";
import AdminOpportunitiesTable from "@/components/admin/AdminOpportunitiesTable";
import AdminInvitePanel from "@/components/admin/AdminInvitePanel";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import { useAdminLevel } from "@/hooks/useAdminLevel";
import { canAccessTab, getDefaultAdminTab } from "@/lib/adminPermissions";
import { parseDashboardPath } from "@/lib/roleRouting";

const BASE_PATH = "/admin/dashboard";
const TABS = [
  "overview", "users", "mentorship", "startups", "opportunities", "posts", "verification",
  "contact", "invitations", "analytics", "audit",
];

const tabTitles: Record<string, string> = {
  overview: "Platform Overview",
  users: "User Management",
  mentorship: "Mentor Assignments",
  startups: "Startups",
  opportunities: "Opportunities",
  posts: "Posts",
  verification: "Verification Requests",
  contact: "Contact Submissions",
  invitations: "Admin Invitations",
  analytics: "Analytics",
  audit: "Audit Log",
};

const AdminDashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminLevel, loading } = useAdminLevel();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { tab: rawTab } = parseDashboardPath(pathname, BASE_PATH);
  const validTab = TABS.includes(rawTab) && canAccessTab(adminLevel, rawTab);
  const fallbackTab = getDefaultAdminTab(adminLevel);
  if (!validTab) return <Navigate to={`${BASE_PATH}/${fallbackTab}`} replace />;
  const activeTab = rawTab;

  const handleTabChange = (tab: string) => {
    navigate(`${BASE_PATH}/${canAccessTab(adminLevel, tab) ? tab : fallbackTab}`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} adminLevel={adminLevel} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold flex-1">{tabTitles[activeTab] || "Admin"}</h1>
          <AdminNotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-6">
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <AdminStatsCards />
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AdminRecentActivity />
                  </div>
                  <AdminRoleDistribution />
                </div>
              </motion.div>
            )}
            {activeTab === "users" && canAccessTab(adminLevel, "users") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminUsersTable adminLevel={adminLevel} />
              </motion.div>
            )}
            {activeTab === "mentorship" && canAccessTab(adminLevel, "mentorship") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminMentorAssignments />
              </motion.div>
            )}
            {activeTab === "startups" && canAccessTab(adminLevel, "startups") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminStartupsTable /></motion.div>
            )}
            {activeTab === "opportunities" && canAccessTab(adminLevel, "opportunities") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminOpportunitiesTable /></motion.div>
            )}
            {activeTab === "posts" && canAccessTab(adminLevel, "posts") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminPostsTable /></motion.div>
            )}
            {activeTab === "verification" && canAccessTab(adminLevel, "verification") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminVerificationRequests adminLevel={adminLevel} />
              </motion.div>
            )}
            {activeTab === "contact" && canAccessTab(adminLevel, "contact") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminContactSubmissions /></motion.div>
            )}
            {activeTab === "invitations" && canAccessTab(adminLevel, "invitations") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminInvitePanel adminLevel={adminLevel} /></motion.div>
            )}
            {activeTab === "analytics" && canAccessTab(adminLevel, "analytics") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminAnalytics />
              </motion.div>
            )}
            {activeTab === "audit" && canAccessTab(adminLevel, "audit") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminAuditLog />
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;