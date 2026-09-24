import { useState, useEffect } from "react";
import {
  Calendar,
  Video,
  BarChart3,
  Sparkles,
  Search,
  Users,
  Compass,
  Briefcase,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import BrowseMentorsDialog from "./BrowseMentorsDialog";
import AIMatchDialog from "./AIMatchDialog";
import ActiveMembers from "./ActiveMembers";
import RecommendedConnections from "./RecommendedConnections";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { railConfig, type RailAction, type RailRole } from "@/lib/dashboardRail";
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
  /**
   * Which dashboard this rail is in. Passed by the page rather than read from
   * the roles array: the buttons switch tabs, and only the page knows which
   * tabs it has.
   */
  role?: RailRole;
  onNavigate?: (tab: string) => void;
}

const ACTION_ICONS: Record<RailAction["icon"], LucideIcon> = {
  sparkles: Sparkles,
  search: Search,
  calendar: Calendar,
  users: Users,
  compass: Compass,
  briefcase: Briefcase,
};

/** Booked hours, from the times on the row rather than a 30-minute guess. */
function sessionHours(session: SessionData): number {
  const [sh, sm] = session.start_time.split(":").map(Number);
  const [eh, em] = session.end_time.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes > 0 ? minutes / 60 : 0;
}

const DashboardRightSidebar = ({ role, onNavigate }: DashboardRightSidebarProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [browseMentorsOpen, setBrowseMentorsOpen] = useState(false);
  const [aiMatchOpen, setAiMatchOpen] = useState(false);

  const config = railConfig(role);

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

  // Count only the side of the booking this dashboard is about: a mentor's
  // progress is the hours they gave, not the hours they were given.
  const counted = config.progress
    ? sessions.filter(s =>
        config.progress!.side === "mentor" ? s.mentor_id === user?.id : s.mentee_id === user?.id,
      )
    : [];
  const completed = counted.filter(s => isPast(parseISO(s.booking_date)));
  const hoursCompleted = Math.round(completed.reduce((sum, s) => sum + sessionHours(s), 0) * 10) / 10;
  const hoursGoal = config.progress?.hoursGoal ?? 20;
  const hoursProgress = Math.min((hoursCompleted / hoursGoal) * 100, 100);

  // For a mentee that is the distinct expertise of their mentors; for a mentor
  // it is the distinct people they have worked with.
  const peers = new Set<string>();
  counted.forEach(s => {
    if (config.progress?.side === "mentor") {
      peers.add(s.mentee_id);
    } else {
      s.other_user?.expertise?.forEach(e => peers.add(e));
    }
  });

  const runAction = (action: RailAction) => {
    if (action.target.kind === "tab") {
      onNavigate?.(action.target.tab);
      return;
    }
    if (action.target.dialog === "browse-mentors") setBrowseMentorsOpen(true);
    else setAiMatchOpen(true);
  };

  return (
    <aside className="hidden w-72 shrink-0 space-y-4 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      {/* Sessions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="a-mentor accent-tile h-7 w-7">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[13px] font-semibold">{config.upcoming.title}</h3>
          </div>
          {config.upcoming.allTab && (
            <button
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onNavigate?.(config.upcoming.allTab!)}
            >
              All
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-muted-foreground">
              {config.upcoming.empty}
            </p>
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
          {config.upcoming.actions.map((action) => {
            const Icon = ACTION_ICONS[action.icon];
            return (
              <Button
                key={action.label}
                variant={action.emphasis === "primary" ? "default" : "outline"}
                size="sm"
                className="rounded-full text-[12px] font-medium"
                onClick={() => runAction(action)}
              >
                <Icon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Progress. Two figures and a bar — the badge-name paragraph that used
          to sit under them explained a reward the member had not asked about.
          Absent for roles with no mentorship funnel, where it would read 0
          forever. */}
      {config.progress && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="a-funding accent-tile h-7 w-7">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[13px] font-semibold">{config.progress.title}</h3>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
              <span className="text-muted-foreground">{config.progress.hoursLabel}</span>
              <span className="font-semibold tabular-nums">
                {hoursCompleted} / {hoursGoal}
              </span>
            </div>
            <Progress value={hoursProgress} className="h-1.5" />
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div>
              <dd className="text-xl font-semibold tabular-nums">{counted.length}</dd>
              <dt className="text-[11px] text-muted-foreground">{config.progress.countLabel}</dt>
            </div>
            <div>
              <dd className="text-xl font-semibold tabular-nums">{peers.size}</dd>
              <dt className="text-[11px] text-muted-foreground">{config.progress.peerLabel}</dt>
            </div>
          </dl>
        </Card>
      )}

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
