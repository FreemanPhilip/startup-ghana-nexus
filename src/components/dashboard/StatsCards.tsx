import { Eye, Handshake, Users, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";

const StatsCards = () => {
  const { profile, roles } = useAuth();
  const { followerCount, followingCount } = useFollows();

  const stats = [
    { label: "Followers", value: followerCount.toString(), icon: Users, change: "" },
    { label: "Following", value: followingCount.toString(), icon: Handshake, change: "" },
    { label: "Role", value: roles[0]?.replace("_", " ") || "Member", icon: Star, change: "" },
    { label: "Membership", value: profile?.membership || "standard", icon: Eye, change: "" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold capitalize">{stat.value}</p>
              {stat.change && (
                <p className="mt-0.5 text-xs font-medium text-emerald">{stat.change}</p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
