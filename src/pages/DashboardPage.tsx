import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
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

const DashboardPage = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          {/* Center content */}
          <main className="flex-1 overflow-y-auto">
            <div className={`mx-auto px-4 md:px-6 py-6 ${activeTab === "messages" ? "" : ["mentors", "investors", "network", "opportunities", "groups"].includes(activeTab) ? "max-w-5xl" : "max-w-3xl"}`}>
              {activeTab === "messages" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <MessagesPage />
                </motion.div>
              )}

              {activeTab === "home" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <EcosystemFeed />
                </motion.div>
              )}

              {activeTab === "network" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <NetworkPage />
                </motion.div>
              )}

              {activeTab === "mentors" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <MentorsPage />
                </motion.div>
              )}

              {activeTab === "investors" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <InvestorsPage />
                </motion.div>
              )}

              {activeTab === "opportunities" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <OpportunitiesPage />
                </motion.div>
              )}

              {activeTab === "groups" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <GroupsPage />
                </motion.div>
              )}

              {!["home", "network", "mentors", "investors", "opportunities", "messages", "groups"].includes(activeTab) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="rounded-xl border border-border bg-card p-12 text-center max-w-md">
                    <h2 className="font-display text-xl font-bold capitalize">{activeTab.replace("_", " ")}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This section is coming soon. Stay tuned for updates!
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </main>

          {/* Right Sidebar - contextual */}
          {activeTab !== "messages" && (activeTab === "investors" ? <InvestorRightSidebar /> : <DashboardRightSidebar />)}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
