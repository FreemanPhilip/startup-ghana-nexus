import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getProfilesByIds } from "@/lib/supabase/queries/profiles";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_user_id: string;
  invited_by: string;
  status: string;
  created_at: string;
}

export function useGroupAdmin(groupId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: joinRequests = [], isLoading } = useQuery({
    queryKey: ["groupJoinRequests", groupId],
    queryFn: async (): Promise<JoinRequest[]> => {
      const { data } = await supabase
        .from("group_join_requests")
        .select("*")
        .eq("group_id", groupId!)
        .eq("status", "pending");

      if (!data || data.length === 0) return [];

      const userIds = data.map(r => r.user_id);
      const profilesMap = await getProfilesByIds(userIds);

      return data.map(r => ({
        ...r,
        full_name: profilesMap.get(r.user_id)?.full_name || null,
        avatar_url: profilesMap.get(r.user_id)?.avatar_url || null,
        headline: profilesMap.get(r.user_id)?.headline || null,
      }));
    },
    enabled: !!groupId,
  });

  useRealtimeSubscription(
    { table: "group_join_requests", filter: `group_id=eq.${groupId}` },
    () => queryClient.invalidateQueries({ queryKey: ["groupJoinRequests", groupId] }),
    !!groupId
  );

  const approveRequest = useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const { error: updateErr } = await supabase
        .from("group_join_requests")
        .update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (updateErr) throw updateErr;
      await supabase.from("group_members").insert({ group_id: groupId!, user_id: userId, role: "member" });
    },
    onSuccess: () => {
      toast({ title: "Request approved" });
      queryClient.invalidateQueries({ queryKey: ["groupJoinRequests", groupId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("group_join_requests")
        .update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Request rejected" });
      queryClient.invalidateQueries({ queryKey: ["groupJoinRequests", groupId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const requestToJoin = useMutation({
    mutationFn: async (message?: string) => {
      const { error } = await supabase.from("group_join_requests").insert({
        group_id: groupId!,
        user_id: user!.id,
        message: message || null,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already requested", description: "You have a pending request." });
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        return;
      }
      toast({ title: "Join request sent!" });
    },
  });

  const inviteUser = useMutation({
    mutationFn: async (invitedUserId: string) => {
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId!)
        .eq("user_id", invitedUserId)
        .maybeSingle();
      if (existing) {
        toast({ title: "Already a member" });
        return;
      }
      const { error } = await supabase.from("group_invitations").insert({
        group_id: groupId!,
        invited_user_id: invitedUserId,
        invited_by: user!.id,
      });
      if (error) {
        if (error.code === "23505") toast({ title: "Already invited" });
        else toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Invitation sent!" });
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberUserId, newRole }: { memberUserId: string; newRole: string }) => {
      if (memberUserId === user!.id) {
        toast({ title: "Cannot change your own role" });
        return;
      }
      const { error } = await supabase.from("group_members").update({ role: newRole }).eq("group_id", groupId!).eq("user_id", memberUserId);
      if (error) throw error;
      toast({ title: `Role updated to ${newRole}` });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
  });

  const removeMember = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (memberUserId === user!.id) {
        toast({ title: "Cannot remove yourself" });
        return;
      }
      await supabase.from("group_members").delete().eq("group_id", groupId!).eq("user_id", memberUserId);
      toast({ title: "Member removed" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["groupDetail", groupId] }),
  });

  return {
    joinRequests,
    loading: isLoading,
    approveRequest: approveRequest.mutateAsync,
    rejectRequest: rejectRequest.mutateAsync,
    requestToJoin: requestToJoin.mutateAsync,
    inviteUser: inviteUser.mutateAsync,
    updateMemberRole: updateMemberRole.mutateAsync,
    removeMember: removeMember.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["groupJoinRequests", groupId] }),
  };
}
