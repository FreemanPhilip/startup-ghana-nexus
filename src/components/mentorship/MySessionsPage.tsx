import { useState, useEffect } from "react";
import { Calendar, Clock, X, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, isPast, parseISO } from "date-fns";
import { getGoogleCalendarUrl, downloadICSFile, type CalendarEvent } from "./calendarUtils";
import RescheduleSessionDialog from "./RescheduleSessionDialog";

interface Booking {
  id: string;
  mentor_id: string;
  mentee_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: string;
  created_at: string;
  other_user?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

const MySessionsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("mentor_bookings")
      .select("*")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .order("booking_date", { ascending: true });

    if (error || !data) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const otherIds = [...new Set(data.map(b => b.mentor_id === user.id ? b.mentee_id : b.mentor_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, headline")
      .in("user_id", otherIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    const enriched: Booking[] = data.map(b => ({
      ...b,
      other_user: profileMap.get(b.mentor_id === user.id ? b.mentee_id : b.mentor_id) ?? undefined,
    }));

    setBookings(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);

    // Find booking to get other user info for notification
    const booking = bookings.find(b => b.id === cancelId);

    const { error } = await supabase
      .from("mentor_bookings")
      .update({ status: "cancelled" })
      .eq("id", cancelId);

    if (error) {
      toast({ title: "Error", description: "Could not cancel session.", variant: "destructive" });
    } else {
      // Send cancellation notification to the other party
      if (booking && user) {
        const otherUserId = booking.mentor_id === user.id ? booking.mentee_id : booking.mentor_id;
        const cancellerName = user.user_metadata?.full_name || "Someone";
        await supabase.from("notifications").insert({
          user_id: otherUserId,
          type: "session_cancelled",
          title: "Session Cancelled",
          body: `${cancellerName} cancelled the mentorship session on ${format(parseISO(booking.booking_date), "MMM d, yyyy")} at ${booking.start_time.slice(0, 5)}.`,
          actor_id: user.id,
          reference_id: booking.id,
        });
      }
      toast({ title: "Session cancelled", description: "The other party has been notified." });
      fetchBookings();
    }
    setCancelling(false);
    setCancelId(null);
  };

  const upcoming = bookings.filter(b => b.status === "confirmed" && !isPast(parseISO(b.booking_date)));
  const past = bookings.filter(b => b.status !== "confirmed" || isPast(parseISO(b.booking_date)));

  const getInitials = (name: string | null) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const isMentor = (b: Booking) => b.mentor_id === user?.id;

  const makeCalendarEvent = (b: Booking): CalendarEvent => {
    const dateStr = b.booking_date;
    const start = new Date(`${dateStr}T${b.start_time}`);
    const end = new Date(`${dateStr}T${b.end_time}`);
    return {
      title: `Mentorship Session with ${b.other_user?.full_name || "User"}`,
      description: b.notes || "Mentorship session booked via GSE Portal",
      startDate: start,
      endDate: end,
    };
  };

  const SessionCard = ({ booking }: { booking: Booking }) => {
    const isUpcoming = booking.status === "confirmed" && !isPast(parseISO(booking.booking_date));
    const calEvent = makeCalendarEvent(booking);

    return (
      <Card className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
            <AvatarImage src={booking.other_user?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs font-bold">
              {getInitials(booking.other_user?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold truncate">
                {booking.other_user?.full_name || "User"}
              </h4>
              <Badge
                variant={booking.status === "confirmed" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"}
                className="shrink-0 text-[10px]"
              >
                {booking.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {isMentor(booking) ? "Mentee" : "Mentor"} • {booking.other_user?.headline || ""}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(booking.booking_date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
              </span>
            </div>
            {booking.notes && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">📝 {booking.notes}</p>
            )}
            {isUpcoming && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] sm:text-xs gap-1 px-2 sm:px-3"
                  onClick={() => window.open(getGoogleCalendarUrl(calEvent), "_blank")}
                >
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">Google Calendar</span>
                  <span className="sm:hidden">Calendar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] sm:text-xs gap-1 px-2 sm:px-3"
                  onClick={() => downloadICSFile(calEvent)}
                >
                  <RefreshCw className="h-3 w-3" />
                  .ics
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] sm:text-xs gap-1 px-2 sm:px-3"
                  onClick={() => setRescheduleBooking(booking)}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-[10px] sm:text-xs gap-1 px-2 sm:px-3"
                  onClick={() => setCancelId(booking.id)}
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold">My Sessions</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">View and manage your mentorship sessions.</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="text-xs sm:text-sm">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-sm">No upcoming sessions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Book a session with a mentor from the Mentors tab.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map(b => <SessionCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : past.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-sm">No past sessions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your completed and cancelled sessions will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {past.map(b => <SessionCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the mentorship session. Both parties will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancelling ? "Cancelling..." : "Cancel Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      {rescheduleBooking && (
        <RescheduleSessionDialog
          open={!!rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          bookingId={rescheduleBooking.id}
          mentorId={rescheduleBooking.mentor_id}
          mentorName={rescheduleBooking.other_user?.full_name || "Mentor"}
          onRescheduled={fetchBookings}
        />
      )}
    </div>
  );
};

export default MySessionsPage;
