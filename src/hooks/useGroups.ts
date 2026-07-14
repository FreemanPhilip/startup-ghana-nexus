import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  fetchAllGroups,
  fetchGroupDetail,
  insertGroup,
  joinGroup,
  leaveGroup,
  updateGroup,
  insertGroupPost,
  insertGroupPostLike,
  deleteGroupPostLike,
  insertGroupPostComment,
  type Group,
  type GroupPost,
  type GroupMember,
} from "@/lib/supabase/queries/groups";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export type { Group, GroupPost, GroupMember };

export function useGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allGroups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => fetchAllGroups(user?.id),
  });

  const myGroups = allGroups.filter(g => g.is_member);

  const createGroup = useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      isPrivate: boolean;
      coverColor: string;
      category?: string;
      iconUrl?: string;
    }) => {
      const { data, error } = await insertGroup({
        name: input.name,
        description: input.description,
        is_private: input.isPrivate,
        cover_color: input.coverColor,
        created_by: user!.id,
        category: input.category,
        icon_url: input.iconUrl,
      });
      if (error) throw error;
      await joinGroupAsAdmin(data.id, user!.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Group created!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => joinGroup(groupId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Joined group!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Left group" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, updates }: { groupId: string; updates: Parameters<typeof updateGroup>[1] }) =>
      updateGroup(groupId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Group updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    groups: allGroups,
    myGroups,
    loading: isLoading,
    createGroup: createGroup.mutateAsync,
    joinGroup: joinGroupMutation.mutate,
    leaveGroup: leaveGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  };
}

import { supabase } from "@/integrations/supabase/client";

async function joinGroupAsAdmin(groupId: string, userId: string) {
  return supabase.from("group_members").insert({ group_id: groupId, user_id: userId, role: "admin" });
}

export function useGroupDetail(groupId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["groupDetail", groupId, user?.id],
    queryFn: () => fetchGroupDetail(groupId!, user?.id),
    enabled: !!groupId,
  });

  const group = data?.group ?? null;
  const posts = data?.posts ?? [];
  const members = data?.members ?? [];

  useRealtimeSubscription(
    { table: "group_posts", filter: `group_id=eq.${groupId}` },
    () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
    !!groupId
  );

  const createPost = useMutation({
    mutationFn: ({ content, imageUrl, videoUrl }: { content: string; imageUrl?: string; videoUrl?: string }) =>
      insertGroupPost(groupId!, user!.id, content, imageUrl, videoUrl),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      if (post.is_liked) {
        await deleteGroupPostLike(postId, user!.id);
      } else {
        await insertGroupPostLike(postId, user!.id);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
  });

  const addComment = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      insertGroupPostComment(postId, user!.id, content),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
  });

  return {
    group,
    posts,
    members,
    loading: isLoading,
    createPost: createPost.mutate,
    toggleLike: toggleLike.mutate,
    addComment: addComment.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
  };
}
