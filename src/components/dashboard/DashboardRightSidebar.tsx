import { useState, useEffect } from "react";
import { Calendar, Video, CheckSquare, BarChart3, Sparkles, Loader2 } from "lucide-react";
import BrowseMentorsDialog from "./BrowseMentorsDialog";
import AIMatchDialog from "./AIMatchDialog";
import ActiveMembers from "./ActiveMembers";
import RecommendedConnections from "./RecommendedConnections";
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
  const [browseMentorsOpen, setBrowseMentorsOpen] = useState(false);
  const [aiMatchOpen, setAiMatchOpen] = useState(false);

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
        .from("public_profiles")
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
    <aside className="hidden w-72 shrink-0 space-y-4 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      {/* Sessions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="a-mentor accent-tile h-7 w-7">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[13px] font-semibold">Upcoming</h3>
          </div>
          <button
            className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onNavigate?.("my-sessions")}
          >
            All
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-muted-foreground">Nothing booked</p>
          ) : (
            upcomingSessions.slice(0, 2).map((session) => {
              const date = parseISO(session.booking_date);
              const timeStr = format(new Date(`2000-01-01T${session.start_time}`), "h:mm a");
              return (
                <div key={session.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <div className="min-w-[34px] text-center">
                    <p className="a-mentor accent-text text-[9px] font-semibold uppercase">{format(date, "MMM")}</p>
                    <p className="text-base font-semibold leading-none tabular-nums">{format(date, "d")}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">
                      {session.other_user?.full_name || "Session"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{timeStr}</p>
                  </div>
                  <Video className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-[12px] font-medium"
            onClick={() => setBrowseMentorsOpen(true)}
          >
            Browse
          </Button>
          <Button
            size="sm"
            className="rounded-full text-[12px] font-medium"
            onClick={() => setAiMatchOpen(true)}
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Match me
          </Button>
        </div>
      </Card>

      {/* Progress. Two figures and a bar — the badge-name paragraph that used
          to sit under them explained a reward the member had not asked about. */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="a-funding accent-tile h-7 w-7">
            <BarChart3 className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-[13px] font-semibold">Progress</h3>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
            <span className="text-muted-foreground">Hours</span>
            <span className="font-semibold tabular-nums">
              {hoursCompleted} / {hourGoal}
            </span>
          </div>
          <Progress value={hoursProgress} className="h-1.5" />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <dd className="text-xl font-semibold tabular-nums">{totalSessions}</dd>
            <dt className="text-[11px] text-muted-foreground">Sessions</dt>
          </div>
          <div>
            <dd className="text-xl font-semibold tabular-nums">{uniqueExpertise.size}</dd>
            <dt className="text-[11px] text-muted-foreground">Skill areas</dt>
          </div>
        </dl>
      </Card>

      <RecommendedConnections />

      <ActiveMembers />

      <BrowseMentorsDialog
        open={browseMentorsOpen}
        onOpenChange={setBrowseMentorsOpen}
        onSelectMentor={() => onNavigate?.("mentors")}
      />
      <AIMatchDialog
        open={aiMatchOpen}
        onOpenChange={setAiMatchOpen}
        onSelectMentor={() => onNavigate?.("mentors")}
      />
    </aside>
  );
};

export default DashboardRightSidebar;
