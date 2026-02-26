import { useState, useEffect } from "react";
import { Calendar, Video, CheckSquare, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast } from "date-fns";

interface SessionData {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: string;
  mentor_id: string;
  mentee_id: string;
  other_user?: {
    full_name: string | null;
    avatar_url: string | null;
    expertise: string[] | null;
  };
}

interface DashboardRightSidebarProps {
  onNavigate?: (tab: string) => void;
}

const DashboardRightSidebar = ({ onNavigate }: DashboardRightSidebarProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      setLoading(true);

      const { data } = await supabase
        .from("mentor_bookings")
        .select("*")
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .eq("status", "confirmed")
        .order("booking_date", { ascending: true });

      if (!data || data.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const otherIds = [...new Set(data.map(b => b.mentor_id === user.id ? b.mentee_id : b.mentor_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, expertise")
        .in("user_id", otherIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      const enriched = data.map(b => ({
        ...b,
        other_user: profileMap.get(b.mentor_id === user.id ? b.mentee_id : b.mentor_id) ?? undefined,
      }));

      setSessions(enriched);
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  const upcomingSessions = sessions.filter(s => !isPast(parseISO(s.booking_date)));
  const pastSessions = sessions.filter(s => isPast(parseISO(s.booking_date)));

  // Calculate mentorship progress
  const totalSessions = sessions.length;
  const completedSessions = pastSessions.length;
  const hoursCompleted = completedSessions * 0.5; // assume 30min sessions
  const hourGoal = 20;
  const hoursProgress = Math.min((hoursCompleted / hourGoal) * 100, 100);

  // Count unique expertise areas from mentors
  const uniqueExpertise = new Set<string>();
  sessions.forEach(s => {
    s.other_user?.expertise?.forEach(e => uniqueExpertise.add(e));
  });

  return (
    <aside className="hidden w-72 shrink-0 space-y-5 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      {/* Upcoming Sessions */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-sm font-bold">Upcoming Sessions</h3>
          </div>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-[10px] font-bold text-primary uppercase tracking-wider"
            onClick={() => onNavigate?.("my-sessions")}
          >
            View Calendar
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No upcoming sessions
            </p>
          ) : (
            upcomingSessions.slice(0, 2).map((session) => {
              const date = parseISO(session.booking_date);
              const monthStr = format(date, "MMM").toUpperCase();
              const dayStr = format(date, "d");
              const timeStr = format(
                new Date(`2000-01-01T${session.start_time}`),
                "h:mm a"
              );

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                >
                  <div className="text-center min-w-[40px]">
                    <p className="text-[9px] font-bold uppercase text-primary">
                      {monthStr}
                    </p>
                    <p className="text-lg font-bold leading-none">{dayStr}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {session.notes?.slice(0, 30) || "Mentorship Session"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      with {session.other_user?.full_name || "User"} · {timeStr}
                    </p>
                  </div>
                  <Video className="h-4 w-4 shrink-0 text-primary" />
                </div>
              );
            })
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full text-xs border-dashed"
          onClick={() => onNavigate?.("mentors")}
        >
          Browse All Mentors
        </Button>
      </Card>

      {/* Mentorship Progress */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold">Mentorship Progress</h3>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-primary text-[10px]">
              Hours Completed
            </span>
            <span className="font-bold">
              {hoursCompleted} / {hourGoal}
            </span>
          </div>
          <Progress value={hoursProgress} className="h-2" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sessions
            </p>
            <p className="text-2xl font-bold mt-1">{totalSessions}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Expertise
            </p>
            <p className="text-2xl font-bold mt-1">{uniqueExpertise.size}</p>
          </div>
        </div>

        {/* Next Milestone */}
        <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Next Milestone
          </p>
          <p className="text-xs mt-1 text-foreground">
            {completedSessions < 5
              ? `Complete ${5 - completedSessions} more session${5 - completedSessions > 1 ? "s" : ""} to earn the "Active Learner" badge.`
              : completedSessions < 10
              ? `Complete ${10 - completedSessions} more session${10 - completedSessions > 1 ? "s" : ""} to earn the "GTM Strategist" badge.`
              : "You're a mentorship champion! 🏆"}
          </p>
        </div>
      </Card>

      {/* AI Matching CTA */}
      <Card className="p-5 bg-foreground text-background border-0">
        <h3 className="text-sm font-bold">Need a specific mentor?</h3>
        <p className="text-xs mt-2 opacity-80 leading-relaxed">
          Our AI matches you with the best industry experts based on your startup's current challenges.
        </p>
        <Button
          className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-foreground font-semibold text-xs"
          onClick={() => onNavigate?.("mentors")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Get AI Matching
        </Button>
      </Card>
    </aside>
  );
};

export default DashboardRightSidebar;
