import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export function useFollows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: followData } = useQuery({
    queryKey: ["follows", user?.id],
    queryFn: async () => {
      const [followingRes, followerRes] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user!.id),
        supabase.from("follows").select("follower_id").eq("following_id", user!.id),
      ]);
      return {
        following: new Set<string>(followingRes.data?.map(f => f.following_id) ?? []),
        followerCount: followerRes.data?.length ?? 0,
        followingCount: followingRes.data?.length ?? 0,
      };
    },
    enabled: !!user,
  });

  const following = followData?.following ?? new Set<string>();
  const followerCount = followData?.followerCount ?? 0;
  const followingCount = followData?.followingCount ?? 0;

  useRealtimeSubscription(
    { table: "follows", filter: `following_id=eq.${user?.id}` },
    () => queryClient.invalidateQueries({ queryKey: ["follows", user?.id] }),
    !!user
  );

  useRealtimeSubscription(
    { table: "follows", filter: `follower_id=eq.${user?.id}` },
    () => queryClient.invalidateQueries({ queryKey: ["follows", user?.id] }),
    !!user
  );

  const toggleFollow = useMutation({
    mutationFn: async (targetUserId: string) => {
      const isCurrentlyFollowing = following.has(targetUserId);
      if (isCurrentlyFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user!.id).eq("following_id", targetUserId);
      } else {
        await supabase.from("follows").insert({ follower_id: user!.id, following_id: targetUserId });
      }
      return { targetUserId, isCurrentlyFollowing };
    },
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({ queryKey: ["follows", user?.id] });
      const prev = queryClient.getQueryData(["follows", user?.id]);
      const isCurrentlyFollowing = following.has(targetUserId);
      queryClient.setQueryData(["follows", user?.id], (old: typeof followData) => {
        if (!old) return old;
        const newFollowing = new Set(old.following);
        if (isCurrentlyFollowing) {
          newFollowing.delete(targetUserId);
        } else {
          newFollowing.add(targetUserId);
        }
        return {
          ...old,
          following: newFollowing,
          followerCount: old.followerCount,
          followingCount: isCurrentlyFollowing ? old.followingCount - 1 : old.followingCount + 1,
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["follows", user?.id], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["follows", user?.id] }),
  });

  const isFollowing = (userId: string) => following.has(userId);

  return {
    following,
    followerCount,
    followingCount,
    toggleFollow: toggleFollow.mutate,
    isFollowing,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["follows", user?.id] }),
  };
}
