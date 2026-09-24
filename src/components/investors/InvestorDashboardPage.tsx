import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import IncomingRequestsTab from "./IncomingRequestsTab";
import { useConnections } from "@/hooks/useConnections";
import { useFollows } from "@/hooks/useFollows";
import { accentClass } from "@/lib/categoryAccents";

const InvestorDashboardPage = () => {
  const { profile } = useAuth();
  const { pendingReceived, connections } = useConnections();
  const { followerCount, followingCount } = useFollows();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your connections and incoming requests.</p>
      </div>

      {/* One hairline group, four figures. Four separate centred cards with
          tracked-caps captions and a coloured icon each was more chrome than
          the numbers it carried. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
        {[
          { label: "Connections", value: connections.size, accent: accentClass("network") },
          { label: "Pending", value: pendingReceived.length, accent: accentClass("opportunity") },
          { label: "Followers", value: followerCount, accent: accentClass("investor") },
          { label: "Following", value: followingCount, accent: accentClass("mentor") },
        ].map((s) => (
          <div key={s.label} className="bg-card p-4">
            <dd className="stat-value">{s.value}</dd>
            <dt className="mt-1 text-[12px] text-muted-foreground">{s.label}</dt>
            <span className={`${s.accent} accent-dot mt-2 block h-0.5 w-6 rounded-full`} aria-hidden="true" />
          </div>
        ))}
      </dl>

      {/* Connection Requests Section */}
      <div>
        <h2 className="mb-4 text-[15px] font-semibold">Requests</h2>
        <IncomingRequestsTab />
      </div>
    </div>
  );
};

export default InvestorDashboardPage;
