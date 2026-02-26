import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFollows() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchFollowData = useCallback(async () => {
    if (!user) return;
    const [followingRes, followerRes] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("follows").select("follower_id").eq("following_id", user.id),
    ]);
    setFollowing(new Set(followingRes.data?.map(f => f.following_id) ?? []));
    setFollowerCount(followerRes.data?.length ?? 0);
    setFollowingCount(followingRes.data?.length ?? 0);
  }, [user]);

  useEffect(() => { fetchFollowData(); }, [fetchFollowData]);

  // Real-time subscription for follower updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`follows-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setFollowerCount(c => c + 1);
          } else if (payload.eventType === "DELETE") {
            setFollowerCount(c => Math.max(0, c - 1));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `follower_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as any;
            setFollowing(prev => new Set(prev).add(newRow.following_id));
            setFollowingCount(c => c + 1);
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as any;
            setFollowing(prev => {
              const n = new Set(prev);
              n.delete(oldRow.following_id);
              return n;
            });
            setFollowingCount(c => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user) return;
    const currentlyFollowing = following.has(targetUserId);
    if (currentlyFollowing) {
      // Optimistic update
      setFollowing(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
      setFollowingCount(c => Math.max(0, c - 1));
      const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      if (error) {
        // Revert
        setFollowing(prev => new Set(prev).add(targetUserId));
        setFollowingCount(c => c + 1);
      }
    } else {
      // Optimistic update
      setFollowing(prev => new Set(prev).add(targetUserId));
      setFollowingCount(c => c + 1);
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      if (error) {
        // Revert
        setFollowing(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
        setFollowingCount(c => Math.max(0, c - 1));
      }
    }
  }, [user, following]);

  const isFollowing = useCallback((userId: string) => following.has(userId), [following]);

  return { following, followerCount, followingCount, toggleFollow, isFollowing, refetch: fetchFollowData };
}
