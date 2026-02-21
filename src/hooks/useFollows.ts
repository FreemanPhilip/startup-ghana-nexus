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

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = following.has(targetUserId);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setFollowing(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
      setFollowingCount(c => c - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      setFollowing(prev => new Set(prev).add(targetUserId));
      setFollowingCount(c => c + 1);
    }
  };

  const isFollowing = (userId: string) => following.has(userId);

  return { following, followerCount, followingCount, toggleFollow, isFollowing };
}
