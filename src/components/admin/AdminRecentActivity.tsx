import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, UserPlus, Building2, Briefcase, Users } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
}

const AdminRecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const [posts, startups, opportunities, groups] = await Promise.all([
        supabase.from("posts").select("id, content, created_at, author_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("startups").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("opportunities").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("groups").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const all: Activity[] = [
        ...(posts.data || []).map((p) => ({ id: p.id, type: "post", description: `New post: "${p.content.slice(0, 60)}..."`, time: p.created_at })),
        ...(startups.data || []).map((s) => ({ id: s.id, type: "startup", description: `Startup registered: ${s.name}`, time: s.created_at })),
        ...(opportunities.data || []).map((o) => ({ id: o.id, type: "opportunity", description: `Opportunity posted: ${o.title}`, time: o.created_at })),
        ...(groups.data || []).map((g) => ({ id: g.id, type: "group", description: `Group created: ${g.name}`, time: g.created_at })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);

      setActivities(all);
      setLoading(false);
    };
    fetchActivity();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "post": return <MessageSquare className="h-4 w-4 text-primary" />;
      case "startup": return <Building2 className="h-4 w-4 text-secondary" />;
      case "opportunity": return <Briefcase className="h-4 w-4 text-accent" />;
      case "group": return <Users className="h-4 w-4 text-primary" />;
      default: return <UserPlus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
      </div>
      {loading ? (
        <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-sm">No recent activity</div>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((a) => (
            <div key={a.id + a.type} className="px-4 py-3 flex items-start gap-3">
              <div className="mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                {getIcon(a.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.description}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(a.time)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRecentActivity;
