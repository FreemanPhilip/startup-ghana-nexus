import { useState, useEffect, useMemo } from "react";
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface StartupAnalyticsProps {
  startupId: string;
}

interface PostEngagement {
  date: string;
  likes: number;
  comments: number;
}

interface TeamGrowth {
  date: string;
  members: number;
}

const StartupAnalytics = ({ startupId }: StartupAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [engagementData, setEngagementData] = useState<PostEngagement[]>([]);
  const [teamData, setTeamData] = useState<TeamGrowth[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);

      // Get all posts for this startup
      const { data: posts } = await supabase
        .from("posts")
        .select("id, created_at")
        .eq("startup_id", startupId);

      const postIds = posts?.map(p => p.id) ?? [];
      setTotalPosts(postIds.length);

      // Get likes and comments counts
      const [likesRes, commentsRes] = await Promise.all([
        postIds.length ? supabase.from("post_likes").select("id, created_at, post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
        postIds.length ? supabase.from("post_comments").select("id, created_at, post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
      ]);

      const likes = likesRes.data ?? [];
      const comments = commentsRes.data ?? [];
      setTotalLikes(likes.length);
      setTotalComments(comments.length);

      // Build daily engagement for last 30 days
      const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
      const engMap = new Map<string, { likes: number; comments: number }>();
      days.forEach(d => engMap.set(format(d, "yyyy-MM-dd"), { likes: 0, comments: 0 }));

      likes.forEach(l => {
        const key = format(new Date(l.created_at), "yyyy-MM-dd");
        const entry = engMap.get(key);
        if (entry) entry.likes++;
      });
      comments.forEach(c => {
        const key = format(new Date(c.created_at), "yyyy-MM-dd");
        const entry = engMap.get(key);
        if (entry) entry.comments++;
      });

      setEngagementData(days.map(d => {
        const key = format(d, "yyyy-MM-dd");
        const entry = engMap.get(key)!;
        return { date: format(d, "MMM dd"), likes: entry.likes, comments: entry.comments };
      }));

      // Team growth
      const { data: members } = await supabase
        .from("startup_members")
        .select("id, created_at, confirmed")
        .eq("startup_id", startupId)
        .eq("confirmed", true)
        .order("created_at", { ascending: true });

      setTeamSize(members?.length ?? 0);

      // Cumulative team growth
      const teamGrowth: TeamGrowth[] = [];
      let count = 0;
      const memberDays = new Map<string, number>();
      members?.forEach(m => {
        const key = format(new Date(m.created_at), "yyyy-MM-dd");
        memberDays.set(key, (memberDays.get(key) ?? 0) + 1);
      });

      days.forEach(d => {
        const key = format(d, "yyyy-MM-dd");
        count += memberDays.get(key) ?? 0;
        teamGrowth.push({ date: format(d, "MMM dd"), members: count });
      });

      // If team existed before 30 days, start with correct count
      const beforeCount = members?.filter(m => new Date(m.created_at) < subDays(new Date(), 30)).length ?? 0;
      if (beforeCount > 0) {
        setTeamData(teamGrowth.map(t => ({ ...t, members: t.members + beforeCount })));
      } else {
        setTeamData(teamGrowth);
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [startupId]);

  const maxEngagement = useMemo(() => Math.max(...engagementData.map(d => d.likes + d.comments), 1), [engagementData]);
  const maxTeam = useMemo(() => Math.max(...teamData.map(d => d.members), 1), [teamData]);
  const avgEngagement = totalPosts > 0 ? ((totalLikes + totalComments) / totalPosts).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Posts", value: totalPosts, icon: BarChart3, color: "text-primary" },
          { label: "Total Likes", value: totalLikes, icon: Heart, color: "text-destructive" },
          { label: "Total Comments", value: totalComments, icon: MessageSquare, color: "text-primary" },
          { label: "Team Size", value: teamSize, icon: Users, color: "text-secondary" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <stat.icon className={`h-5 w-5 mx-auto mb-1.5 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement Rate */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Post Engagement (30 days)
          </h3>
          <span className="text-xs text-muted-foreground">Avg {avgEngagement} / post</span>
        </div>

        {/* Simple bar chart */}
        <div className="mt-4 flex items-end gap-[2px] h-32">
          {engagementData.map((d, i) => {
            const total = d.likes + d.comments;
            const h = (total / maxEngagement) * 100;
            const likeH = total > 0 ? (d.likes / total) * h : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-stretch justify-end h-full group relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap hidden group-hover:block z-10 shadow-sm">
                  {d.date}: {d.likes}❤️ {d.comments}💬
                </div>
                <div className="flex flex-col justify-end" style={{ height: `${Math.max(h, 2)}%` }}>
                  <div className="bg-destructive/60 rounded-t-sm" style={{ height: `${likeH}%`, minHeight: total > 0 ? '1px' : '0' }} />
                  <div className="bg-primary/60 rounded-b-sm" style={{ height: `${h - likeH}%`, minHeight: total > 0 ? '1px' : '0' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
          <span>{engagementData[0]?.date}</span>
          <span>{engagementData[engagementData.length - 1]?.date}</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm bg-destructive/60" /> Likes
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" /> Comments
          </div>
        </div>
      </div>

      {/* Team Growth */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" /> Team Growth (30 days)
        </h3>
        <div className="relative h-32">
          <svg viewBox={`0 0 ${teamData.length} 100`} className="w-full h-full" preserveAspectRatio="none">
            {/* Area fill */}
            <path
              d={`M0 100 ${teamData.map((d, i) => `L${i} ${100 - (d.members / maxTeam) * 90}`).join(" ")} L${teamData.length - 1} 100 Z`}
              fill="hsl(var(--primary) / 0.1)"
            />
            {/* Line */}
            <path
              d={`M0 ${100 - (teamData[0]?.members ?? 0) / maxTeam * 90} ${teamData.map((d, i) => `L${i} ${100 - (d.members / maxTeam) * 90}`).join(" ")}`}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
          <span>{teamData[0]?.date}</span>
          <span>{teamData[teamData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Profile Views (mock - since we don't track views yet) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Profile Views
          </h3>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Profile view tracking will be available soon. You'll be able to see who viewed your startup profile and track trends over time.
        </p>
      </div>
    </div>
  );
};

export default StartupAnalytics;
