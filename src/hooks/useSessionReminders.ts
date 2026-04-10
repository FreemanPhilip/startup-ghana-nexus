import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { parseISO, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function useSessionReminders() {
  const { user } = useAuth();

  const checkAndSendReminders = useCallback(async () => {
    if (!user) return;

    // Fetch upcoming confirmed bookings
    const { data: bookings } = await supabase
      .from("mentor_bookings")
      .select("*")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
      .eq("status", "confirmed")
      .order("booking_date", { ascending: true });

    if (!bookings || bookings.length === 0) return;

    // Fetch already sent reminders for this user
    const { data: sentReminders } = await supabase
      .from("session_reminders")
      .select("booking_id, reminder_type")
      .eq("user_id", user.id);

    const sentSet = new Set(
      (sentReminders ?? []).map((r: any) => `${r.booking_id}-${r.reminder_type}`)
    );

    // Get profiles for other users
    const otherIds = [...new Set(bookings.map(b => b.mentor_id === user.id ? b.mentee_id : b.mentor_id))];
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("user_id, full_name")
      .in("user_id", otherIds);
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));

    const now = new Date();

    for (const booking of bookings) {
      const sessionDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      if (isPast(sessionDateTime)) continue;

      const hoursUntil = differenceInHours(sessionDateTime, now);
      const minutesUntil = differenceInMinutes(sessionDateTime, now);

      const otherId = booking.mentor_id === user.id ? booking.mentee_id : booking.mentor_id;
      const otherName = profileMap.get(otherId) || "your session partner";
      const role = booking.mentor_id === user.id ? "mentee" : "mentor";

      // 24-hour reminder
      if (hoursUntil <= 24 && hoursUntil > 1 && !sentSet.has(`${booking.id}-24h`)) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "session_reminder",
          title: "Session Tomorrow",
          body: `Reminder: You have a mentorship session with ${otherName} (${role}) in ${hoursUntil} hours.`,
          actor_id: otherId,
          reference_id: booking.id,
        });

        await supabase.from("session_reminders").insert({
          booking_id: booking.id,
          user_id: user.id,
          reminder_type: "24h",
        } as any);

        toast({
          title: "⏰ Session Reminder",
          description: `You have a session with ${otherName} in ${hoursUntil} hours.`,
        });
      }

      // 1-hour reminder
      if (minutesUntil <= 60 && minutesUntil > 5 && !sentSet.has(`${booking.id}-1h`)) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "session_reminder",
          title: "Session Starting Soon",
          body: `Your mentorship session with ${otherName} (${role}) starts in ${minutesUntil} minutes!`,
          actor_id: otherId,
          reference_id: booking.id,
        });

        await supabase.from("session_reminders").insert({
          booking_id: booking.id,
          user_id: user.id,
          reminder_type: "1h",
        } as any);

        toast({
          title: "🔔 Session Starting Soon!",
          description: `Your session with ${otherName} starts in ${minutesUntil} minutes!`,
        });
      }
    }
  }, [user]);

  useEffect(() => {
    // Check immediately on mount
    checkAndSendReminders();

    // Then check every 5 minutes
    const interval = setInterval(checkAndSendReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndSendReminders]);
}
