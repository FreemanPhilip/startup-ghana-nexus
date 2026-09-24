import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MentorBriefingBooking {
  id: string;
  mentor_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  mentor_name?: string | null;
}

interface MentorBriefingUpdate {
  id: string;
  title: string;
  body: string | null;
  type: "meeting" | "task";
  created_at: string;
  actor_name?: string | null;
}

const MentorBriefingPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MentorBriefingBooking[]>([]);
  const [updates, setUpdates] = useState<MentorBriefingUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadBriefing = async () => {
      setLoading(true);

      const [{ data: bookingRows, error: bookingError }, { data: updateRows, error: updateError }] = await Promise.all([
        supabase
          .from("mentor_bookings")
          .select("*")
          .eq("mentee_id", user.id)
          .order("booking_date", { ascending: true }),
        supabase
          .from("notifications")
          .select("id, title, body, type, created_at, actor_id")
          .eq("user_id", user.id)
          .in("type", ["meeting", "task"])
          .order("created_at", { ascending: false }),
      ]);

      if (bookingError) {
        console.warn("Mentor briefing bookings fetch failed:", bookingError);
      }

      if (updateError) {
        console.warn("Mentor briefing updates fetch failed:", updateError);
      }

      const uniqueMentorIds = [...new Set((bookingRows ?? []).map((row) => row.mentor_id).filter(Boolean))] as string[];
      let mentorNames = new Map<string, string>();

      if (uniqueMentorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("user_id, full_name")
          .in("user_id", uniqueMentorIds);

        mentorNames = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.full_name]));
      }

      const actorIds = [...new Set((updateRows ?? []).map((row) => row.actor_id).filter(Boolean) as string[])];
      let actorNames = new Map<string, string>();

      if (actorIds.length > 0) {
        const { data: actorProfiles } = await supabase
          .from("public_profiles")
          .select("user_id, full_name")
          .in("user_id", actorIds);

        actorNames = new Map((actorProfiles ?? []).map((profile) => [profile.user_id, profile.full_name]));
      }

      setBookings(
        (bookingRows ?? []).map((row) => ({
          ...row,
          mentor_name: mentorNames.get(row.mentor_id) ?? "Mentor",
        })),
      );

      setUpdates(
        (updateRows ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          type: row.type as "meeting" | "task",
          created_at: row.created_at,
          actor_name: row.actor_id ? actorNames.get(row.actor_id) ?? "Mentor" : "Mentor",
        })),
      );
      setLoading(false);
    };

    void loadBriefing();
  }, [user]);

  const upcomingSessions = useMemo(
    () => bookings.filter((booking) => booking.status === "confirmed"),
    [bookings],
  );

  const openTaskCount = updates.filter((update) => update.type === "task").length;
  const latestUpdate = updates[0] ?? null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Founder briefing</p>
          <h1 className="mt-1 page-title">Mentor management</h1>
        </div>
        <Badge variant="outline">{bookings.length} recorded sessions</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Upcoming sessions</p>
          <p className="mt-3 text-3xl font-semibold">{upcomingSessions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mentor tasks</p>
          <p className="mt-3 text-3xl font-semibold">{openTaskCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Latest update</p>
          <p className="mt-3 text-lg font-semibold">{latestUpdate ? latestUpdate.type : "No activity yet"}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Upcoming mentor touchpoints</h2>
          </div>

          <div className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No mentorship sessions are currently confirmed.
              </div>
            ) : (
              upcomingSessions.slice(0, 4).map((booking) => (
                <div key={booking.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{booking.mentor_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.notes || "Mentor check-in"}</p>
                    </div>
                    <Badge variant="default" className="text-[10px]">{booking.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                      <CalendarDays className="h-3 w-3" /> {new Date(`${booking.booking_date}T${booking.start_time}`).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                      <Clock3 className="h-3 w-3" /> {booking.start_time.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Recent mentor updates</h2>
          </div>

          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No mentor notes or assigned tasks have been shared yet.
              </div>
            ) : (
              updates.slice(0, 4).map((update) => (
                <div key={update.id} className={cn("rounded-xl border border-border bg-muted/20 p-3", update.type === "task" && "border-amber-500/20 bg-amber-500/5")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{update.title}</p>
                    <Badge variant={update.type === "meeting" ? "default" : "secondary"} className="text-[10px]">
                      {update.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{update.body || "No additional detail provided."}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{update.actor_name} · {new Date(update.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {latestUpdate && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">Priority follow-up</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div>
              <p className="font-medium">{latestUpdate.title}</p>
              <p className="text-xs text-muted-foreground">{latestUpdate.body || "Keep this moving with your mentor."}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
        </Card>
      )}
    </div>
  );
};

export default MentorBriefingPage;
