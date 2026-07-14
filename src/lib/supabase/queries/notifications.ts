import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  actor_id: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Notification[]) ?? [];
}

export async function markNotificationAsRead(id: string) {
  return supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllNotificationsAsRead(userId: string) {
  return supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function clearAllNotifications(userId: string) {
  return supabase.from("notifications").delete().eq("user_id", userId);
}
