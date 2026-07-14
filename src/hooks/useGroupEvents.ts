import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

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
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["groupEvents", groupId],
    queryFn: async (): Promise<GroupEvent[]> => {
      const { data: eventsRaw } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId!)
        .order("event_date", { ascending: true });

      if (!eventsRaw || eventsRaw.length === 0) return [];

      const eventIds = eventsRaw.map(e => e.id);
      const { data: rsvps } = await supabase
        .from("group_event_rsvps")
        .select("event_id, user_id, status")
        .in("event_id", eventIds);

      const rsvpCountMap = new Map<string, number>();
      const myRsvpMap = new Map<string, string>();
      rsvps?.forEach(r => {
        if (r.status === "going") rsvpCountMap.set(r.event_id, (rsvpCountMap.get(r.event_id) || 0) + 1);
        if (r.user_id === user?.id) myRsvpMap.set(r.event_id, r.status);
      });

      return eventsRaw.map(e => ({
        ...e,
        rsvp_count: rsvpCountMap.get(e.id) || 0,
        my_rsvp: myRsvpMap.get(e.id) || null,
      }));
    },
    enabled: !!groupId,
  });

  useRealtimeSubscription(
    { table: "group_events", filter: `group_id=eq.${groupId}` },
    () => queryClient.invalidateQueries({ queryKey: ["groupEvents", groupId] }),
    !!groupId
  );

  const createEvent = useMutation({
    mutationFn: async (data: { title: string; description: string; event_date: string; location: string; is_virtual: boolean }) => {
      const { error } = await supabase.from("group_events").insert({
        group_id: groupId!,
        created_by: user!.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Event created!" });
      queryClient.invalidateQueries({ queryKey: ["groupEvents", groupId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleRsvp = useMutation({
    mutationFn: async (eventId: string) => {
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      if (event.my_rsvp === "going") {
        await supabase.from("group_event_rsvps").delete().eq("event_id", eventId).eq("user_id", user!.id);
      } else {
        const { error } = await supabase.from("group_event_rsvps").upsert({
          event_id: eventId,
          user_id: user!.id,
          status: "going",
        }, { onConflict: "event_id,user_id" });
        if (error) throw error;
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["groupEvents", groupId] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      await supabase.from("group_events").delete().eq("id", eventId);
    },
    onSuccess: () => {
      toast({ title: "Event deleted" });
      queryClient.invalidateQueries({ queryKey: ["groupEvents", groupId] });
    },
  });

  return {
    events,
    loading: isLoading,
    createEvent: createEvent.mutateAsync,
    toggleRsvp: toggleRsvp.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["groupEvents", groupId] }),
  };
}
