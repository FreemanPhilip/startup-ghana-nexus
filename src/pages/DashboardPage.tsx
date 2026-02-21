import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRightSidebar from "@/components/dashboard/DashboardRightSidebar";
import StatsCards from "@/components/dashboard/StatsCards";
import EcosystemFeed from "@/components/dashboard/EcosystemFeed";

const DashboardPage = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <div className="flex flex-1 overflow-hidden">
          {/* Center content */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-8">
              {activeTab === "home" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h1 className="font-display text-2xl font-bold">
                      {profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}` : "Welcome"} 👋
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Here's what's happening in the Ghana ecosystem today.
                    </p>
                  </div>
                  <StatsCards />
                  <EcosystemFeed />
                </motion.div>
              )}

              {activeTab !== "home" && (
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

          {/* Right Sidebar */}
          <DashboardRightSidebar />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
