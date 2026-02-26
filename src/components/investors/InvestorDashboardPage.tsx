import { motion } from "framer-motion";
import { Inbox, TrendingUp, Users, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import IncomingRequestsTab from "./IncomingRequestsTab";
import { useConnections } from "@/hooks/useConnections";
import { useFollows } from "@/hooks/useFollows";

const InvestorDashboardPage = () => {
  const { profile } = useAuth();
  const { pendingReceived, connections } = useConnections();
  const { followerCount, followingCount } = useFollows();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Investor Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your connections, review deal flow, and track your network activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{connections.size}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Connections</p>
        </Card>
        <Card className="p-4 text-center">
          <Inbox className="h-5 w-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{pendingReceived.length}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pending Requests</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{followerCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Followers</p>
        </Card>
        <Card className="p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{followingCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Following</p>
        </Card>
      </div>

      {/* Connection Requests Section */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">Connection Requests</h2>
        <IncomingRequestsTab />
      </div>
    </div>
  );
};

export default InvestorDashboardPage;
