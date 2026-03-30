import { useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminStartupsTable from "@/components/admin/AdminStartupsTable";
import AdminContactSubmissions from "@/components/admin/AdminContactSubmissions";
import AdminRecentActivity from "@/components/admin/AdminRecentActivity";
import AdminRoleDistribution from "@/components/admin/AdminRoleDistribution";
import AdminVerificationRequests from "@/components/admin/AdminVerificationRequests";
import AdminPostsTable from "@/components/admin/AdminPostsTable";
import AdminOpportunitiesTable from "@/components/admin/AdminOpportunitiesTable";

const tabTitles: Record<string, string> = {
  overview: "Platform Overview",
  users: "User Management",
  startups: "Startups",
  opportunities: "Opportunities",
  posts: "Posts",
  verification: "Verification Requests",
  contact: "Contact Submissions",
  analytics: "Analytics",
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-bold">{tabTitles[activeTab] || "Admin"}</h1>
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
            {activeTab === "users" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminUsersTable /></motion.div>}
            {activeTab === "startups" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminStartupsTable /></motion.div>}
            {activeTab === "opportunities" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminOpportunitiesTable /></motion.div>}
            {activeTab === "posts" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminPostsTable /></motion.div>}
            {activeTab === "verification" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminVerificationRequests /></motion.div>}
            {activeTab === "contact" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AdminContactSubmissions /></motion.div>}
            {activeTab === "analytics" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <AdminStatsCards />
                <AdminRoleDistribution />
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
