import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const AdminRoleDistribution = () => {
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      setDistribution(counts);
      setLoading(false);
    };
    fetch();
  }, []);

  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);

  const roleColors: Record<string, string> = {
    startup_founder: "bg-primary",
    investor: "bg-secondary",
    mentor: "bg-accent",
    ecosystem_partner: "bg-blue-500",
    admin: "bg-destructive",
    service_provider: "bg-purple-500",
    member: "bg-muted-foreground",
  };

  const roleLabels: Record<string, string> = {
    startup_founder: "Founders",
    investor: "Investors",
    mentor: "Mentors",
    ecosystem_partner: "Partners",
    admin: "Admins",
    service_provider: "Service Providers",
    member: "Members",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4">Role Distribution</h3>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : total === 0 ? (
        <p className="text-muted-foreground text-sm">No users yet</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(distribution).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={role}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize font-medium">{roleLabels[role] || role.replace("_", " ")}</span>
                  <span className="text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${roleColors[role] || "bg-muted-foreground"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRoleDistribution;
