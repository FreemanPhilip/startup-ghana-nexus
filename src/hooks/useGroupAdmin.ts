import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJoinRequests = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const { data } = await supabase
      .from("group_join_requests")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "pending");

    if (data && data.length > 0) {
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headline")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setJoinRequests(data.map(r => ({
        ...r,
        full_name: profileMap.get(r.user_id)?.full_name || null,
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
        headline: profileMap.get(r.user_id)?.headline || null,
      })));
    } else {
      setJoinRequests([]);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchJoinRequests(); }, [fetchJoinRequests]);

  // Realtime
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-requests-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_join_requests", filter: `group_id=eq.${groupId}` }, () => fetchJoinRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, fetchJoinRequests]);

  const approveRequest = async (requestId: string, userId: string) => {
    if (!groupId || !user) return;
    const { error: updateErr } = await supabase
      .from("group_join_requests")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", requestId);
    if (updateErr) { toast({ title: "Error", description: updateErr.message, variant: "destructive" }); return; }

    await supabase.from("group_members").insert({ group_id: groupId, user_id: userId, role: "member" });
    toast({ title: "Request approved" });
    fetchJoinRequests();
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("group_join_requests")
      .update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request rejected" });
    fetchJoinRequests();
  };

  const requestToJoin = async (message?: string) => {
    if (!user || !groupId) return;
    const { error } = await supabase.from("group_join_requests").insert({
      group_id: groupId, user_id: user.id, message: message || null,
    });
    if (error) {
      if (error.code === "23505") toast({ title: "Already requested", description: "You have a pending request." });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Join request sent!" });
  };

  const inviteUser = async (invitedUserId: string) => {
    if (!user || !groupId) return;
    // Check if already a member
    const { data: existing } = await supabase.from("group_members").select("id").eq("group_id", groupId).eq("user_id", invitedUserId).maybeSingle();
    if (existing) { toast({ title: "Already a member" }); return; }

    const { error } = await supabase.from("group_invitations").insert({
      group_id: groupId, invited_user_id: invitedUserId, invited_by: user.id,
    });
    if (error) {
      if (error.code === "23505") toast({ title: "Already invited" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Invitation sent!" });
  };

  const updateMemberRole = async (memberId: string, memberUserId: string, newRole: string) => {
    if (!user || !groupId) return;
    if (memberUserId === user.id) { toast({ title: "Cannot change your own role" }); return; }
    const { error } = await supabase.from("group_members").update({ role: newRole }).eq("group_id", groupId).eq("user_id", memberUserId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Role updated to ${newRole}` });
  };

  const removeMember = async (memberUserId: string) => {
    if (!user || !groupId) return;
    if (memberUserId === user.id) { toast({ title: "Cannot remove yourself" }); return; }
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberUserId);
    toast({ title: "Member removed" });
  };

  return {
    joinRequests, loading,
    approveRequest, rejectRequest, requestToJoin,
    inviteUser, updateMemberRole, removeMember,
    refetch: fetchJoinRequests,
  };
}
