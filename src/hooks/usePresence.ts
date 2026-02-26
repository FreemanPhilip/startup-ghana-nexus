import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const OFFLINE_TIMEOUT = 60_000; // 1 minute = considered offline

export function usePresenceTracker() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const updatePresence = useCallback(async (online: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_presence")
      .upsert(
        { user_id: user.id, last_seen: new Date().toISOString(), is_online: online },
        { onConflict: "user_id" }
      );
    // silently ignore errors
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Go online
    updatePresence(true);

    // Heartbeat
    intervalRef.current = setInterval(() => updatePresence(true), HEARTBEAT_INTERVAL);

    // Go offline on unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`;
      const body = JSON.stringify({ is_online: false, last_seen: new Date().toISOString() });
      navigator.sendBeacon?.(url); // best effort
      updatePresence(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false);
      } else {
        updatePresence(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updatePresence(false);
    };
  }, [user, updatePresence]);
}

export function formatLastSeen(lastSeen: string | null, isOnline: boolean): string {
  if (isOnline) return "Online";
  if (!lastSeen) return "Offline";

  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
