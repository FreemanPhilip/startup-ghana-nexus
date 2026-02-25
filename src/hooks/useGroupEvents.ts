import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface GroupEvent {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  is_virtual: boolean;
  created_by: string;
  created_at: string;
  rsvp_count: number;
  my_rsvp: string | null;
}

export function useGroupEvents(groupId: string | null) {
  const { user } = useAuth();
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data: eventsRaw } = await supabase
      .from("group_events")
      .select("*")
      .eq("group_id", groupId)
      .order("event_date", { ascending: true });

    if (!eventsRaw || eventsRaw.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const eventIds = eventsRaw.map(e => e.id);
    const { data: rsvps } = await supabase
      .from("group_event_rsvps")
      .select("event_id, user_id, status")
      .in("event_id", eventIds);

    const rsvpCountMap = new Map<string, number>();
    const myRsvpMap = new Map<string, string>();
    rsvps?.forEach(r => {
      if (r.status === "going") {
        rsvpCountMap.set(r.event_id, (rsvpCountMap.get(r.event_id) || 0) + 1);
      }
      if (r.user_id === user?.id) myRsvpMap.set(r.event_id, r.status);
    });

    setEvents(eventsRaw.map(e => ({
      ...e,
      rsvp_count: rsvpCountMap.get(e.id) || 0,
      my_rsvp: myRsvpMap.get(e.id) || null,
    })));
    setLoading(false);
  }, [groupId, user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-events-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_events", filter: `group_id=eq.${groupId}` }, () => fetchEvents())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_event_rsvps" }, () => fetchEvents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, fetchEvents]);

  const createEvent = async (data: { title: string; description: string; event_date: string; location: string; is_virtual: boolean }) => {
    if (!user || !groupId) return;
    const { error } = await supabase.from("group_events").insert({
      group_id: groupId,
      created_by: user.id,
      ...data,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event created!" });
    fetchEvents();
  };

  const toggleRsvp = async (eventId: string) => {
    if (!user) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (event.my_rsvp === "going") {
      await supabase.from("group_event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
    } else {
      const { error } = await supabase.from("group_event_rsvps").upsert({
        event_id: eventId, user_id: user.id, status: "going",
      }, { onConflict: "event_id,user_id" });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    fetchEvents();
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from("group_events").delete().eq("id", eventId);
    toast({ title: "Event deleted" });
    fetchEvents();
  };

  return { events, loading, createEvent, toggleRsvp, deleteEvent, refetch: fetchEvents };
}
