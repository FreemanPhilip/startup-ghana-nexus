import { useEffect, useState } from "react";
import { Users, Building2, Briefcase, MessageSquare, UserCheck, Star, TrendingUp, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalUsers: number;
  totalStartups: number;
  totalOpportunities: number;
  totalPosts: number;
  totalGroups: number;
  totalConnections: number;
  totalMentorBookings: number;
  totalContactSubmissions: number;
}

const AdminStatsCards = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalStartups: 0, totalOpportunities: 0, totalPosts: 0,
    totalGroups: 0, totalConnections: 0, totalMentorBookings: 0, totalContactSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [users, startups, opportunities, posts, groups, connections, bookings, contacts] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("startups").select("*", { count: "exact", head: true }),
        supabase.from("opportunities").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("connection_requests").select("*", { count: "exact", head: true }).eq("status", "accepted"),
        supabase.from("mentor_bookings").select("*", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        totalUsers: users.count ?? 0,
        totalStartups: startups.count ?? 0,
        totalOpportunities: opportunities.count ?? 0,
        totalPosts: posts.count ?? 0,
        totalGroups: groups.count ?? 0,
        totalConnections: connections.count ?? 0,
        totalMentorBookings: bookings.count ?? 0,
        totalContactSubmissions: contacts.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Startups", value: stats.totalStartups, icon: Building2, color: "text-secondary" },
    { label: "Opportunities", value: stats.totalOpportunities, icon: Briefcase, color: "text-accent" },
    { label: "Posts", value: stats.totalPosts, icon: MessageSquare, color: "text-primary" },
    { label: "Groups", value: stats.totalGroups, icon: UserCheck, color: "text-secondary" },
    { label: "Connections", value: stats.totalConnections, icon: TrendingUp, color: "text-accent" },
    { label: "Mentor Sessions", value: stats.totalMentorBookings, icon: Star, color: "text-primary" },
    { label: "Contact Forms", value: stats.totalContactSubmissions, icon: FileText, color: "text-secondary" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">
                {loading ? "—" : card.value.toLocaleString()}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
