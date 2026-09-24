import { Eye, Handshake, Users, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";

const StatsCards = () => {
  const { profile, roles } = useAuth();
  const { followerCount, followingCount } = useFollows();

  const stats = [
    { label: "Followers", value: followerCount.toString(), icon: Users },
    { label: "Following", value: followingCount.toString(), icon: Handshake },
    { label: "Role", value: roles[0]?.replace("_", " ") || "Member", icon: Star },
    { label: "Membership", value: profile?.membership || "standard", icon: Eye },
  ];

  return (
    // One hairline-separated group rather than four detached cards — these are
    // four readings of the same account, so they should look like one object.
    <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-start justify-between gap-3 bg-card p-5">
          <div className="min-w-0">
            <p className="label-xs">{stat.label}</p>
            <p className="stat-value mt-2 truncate capitalize">{stat.value}</p>
          </div>
          <stat.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
