import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, Activity, Calendar } from "lucide-react";

interface GrowthData { month: string; users: number; startups: number; posts: number; }
interface RolePieData { name: string; value: number; color: string; }
interface EngagementData { month: string; connections: number; messages: number; bookings: number; }
interface SignupData { day: string; count: number; }

const ROLE_COLORS: Record<string, string> = {
  startup_founder: "hsl(var(--primary))",
  investor: "hsl(var(--secondary))",
  mentor: "hsl(var(--accent))",
  ecosystem_partner: "#3b82f6",
  admin: "#ef4444",
  service_provider: "#a855f7",
  member: "#6b7280",
};

const ROLE_LABELS: Record<string, string> = {
  startup_founder: "Founders",
  investor: "Investors",
  mentor: "Mentors",
  ecosystem_partner: "Partners",
  admin: "Admins",
  service_provider: "Service Providers",
  member: "Members",
};

const AdminAnalytics = () => {
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [rolePieData, setRolePieData] = useState<RolePieData[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [recentSignups, setRecentSignups] = useState<SignupData[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    newUsersThisMonth: 0,
    newStartupsThisMonth: 0,
    activeConnections: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [profiles, startups, posts, roles, connections, bookings, messages] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("startups").select("created_at"),
        supabase.from("posts").select("created_at"),
        supabase.from("user_roles").select("role"),
        supabase.from("connection_requests").select("created_at, status"),
        supabase.from("mentor_bookings").select("created_at"),
        supabase.from("conversations").select("created_at"),
      ]);

      // Build monthly growth data (last 6 months)
      const months = getLastMonths(6);
      const growth: GrowthData[] = months.map((m) => ({
        month: m.label,
        users: countInMonth(profiles.data || [], m.start, m.end),
        startups: countInMonth(startups.data || [], m.start, m.end),
        posts: countInMonth(posts.data || [], m.start, m.end),
      }));
      setGrowthData(growth);

      // Role pie chart
      const roleCounts: Record<string, number> = {};
      roles.data?.forEach((r) => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
      const pieData: RolePieData[] = Object.entries(roleCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([role, value]) => ({
          name: ROLE_LABELS[role] || role,
          value,
          color: ROLE_COLORS[role] || "#6b7280",
        }));
      setRolePieData(pieData);

      // Engagement data (last 6 months)
      const engagement: EngagementData[] = months.map((m) => ({
        month: m.label,
        connections: countInMonth((connections.data || []).filter(c => c.status === "accepted"), m.start, m.end),
        messages: countInMonth(messages.data || [], m.start, m.end),
        bookings: countInMonth(bookings.data || [], m.start, m.end),
      }));
      setEngagementData(engagement);

      // Recent daily signups (last 14 days)
      const days = getLastDays(14);
      const daily: SignupData[] = days.map((d) => ({
        day: d.label,
        count: countInDay(profiles.data || [], d.date),
      }));
      setRecentSignups(daily);

      // Summary stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setSummaryStats({
        newUsersThisMonth: (profiles.data || []).filter(p => new Date(p.created_at) >= monthStart).length,
        newStartupsThisMonth: (startups.data || []).filter(s => new Date(s.created_at) >= monthStart).length,
        activeConnections: (connections.data || []).filter(c => c.status === "accepted").length,
        totalSessions: bookings.data?.length || 0,
      });
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="New Users This Month" value={summaryStats.newUsersThisMonth} accent="primary" />
        <SummaryCard icon={TrendingUp} label="New Startups This Month" value={summaryStats.newStartupsThisMonth} accent="secondary" />
        <SummaryCard icon={Activity} label="Active Connections" value={summaryStats.activeConnections} accent="accent" />
        <SummaryCard icon={Calendar} label="Total Mentor Sessions" value={summaryStats.totalSessions} accent="primary" />
      </div>

      {/* User Growth Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Platform Growth (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={growthData}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorStartups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Legend />
            <Area type="monotone" dataKey="users" name="Users" stroke="hsl(var(--primary))" fill="url(#colorUsers)" strokeWidth={2} />
            <Area type="monotone" dataKey="startups" name="Startups" stroke="hsl(var(--secondary))" fill="url(#colorStartups)" strokeWidth={2} />
            <Area type="monotone" dataKey="posts" name="Posts" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role Distribution Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">User Role Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={rolePieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {rolePieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Signups Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Daily Signups (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={recentSignups}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="count" name="Signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Trends */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Engagement Trends (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Legend />
            <Line type="monotone" dataKey="connections" name="Connections" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="messages" name="Conversations" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="bookings" name="Mentor Sessions" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Helper: Summary card
const SummaryCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${accent}/10`}>
        <Icon className={`h-4 w-4 text-${accent}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold">{value.toLocaleString()}</p>
      </div>
    </div>
  </div>
);

// Helper: get last N months
function getLastMonths(n: number) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    result.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      start: d,
      end,
    });
  }
  return result;
}

// Helper: count items in a month
function countInMonth(items: { created_at: string }[], start: Date, end: Date) {
  return items.filter((item) => {
    const d = new Date(item.created_at);
    return d >= start && d <= end;
  }).length;
}

// Helper: get last N days
function getLastDays(n: number) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: d.toISOString().split("T")[0],
    });
  }
  return result;
}

// Helper: count items in a day
function countInDay(items: { created_at: string }[], dateStr: string) {
  return items.filter((item) => item.created_at.startsWith(dateStr)).length;
}

export default AdminAnalytics;
