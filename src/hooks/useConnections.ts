import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    company_name: string | null;
  };
  receiver_profile?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    company_name: string | null;
  };
}

export function useConnections() {
  const { user } = useAuth();
  const [pendingReceived, setPendingReceived] = useState<ConnectionRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get all connection requests involving the user
    const { data: requests } = await supabase
      .from("connection_requests")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!requests) {
      setLoading(false);
      return;
    }

    // Separate by status and direction
    const received = requests.filter(r => r.receiver_id === user.id && r.status === "pending");
    const sent = requests.filter(r => r.sender_id === user.id && r.status === "pending");
    const accepted = requests.filter(r => r.status === "accepted");

    // Build connected user set
    const connectedIds = new Set<string>();
    accepted.forEach(r => {
      connectedIds.add(r.sender_id === user.id ? r.receiver_id : r.sender_id);
    });

    // Fetch profiles for pending received
    const allUserIds = [...new Set([
      ...received.map(r => r.sender_id),
      ...sent.map(r => r.receiver_id),
    ])];

    let profileMap = new Map<string, any>();
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, full_name, avatar_url, headline, company_name")
        .in("user_id", allUserIds);
      profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    }

    setPendingReceived(received.map(r => ({
      ...r,
      sender_profile: profileMap.get(r.sender_id),
    })));
    setPendingSent(sent.map(r => ({
      ...r,
      receiver_profile: profileMap.get(r.receiver_id),
    })));
    setConnections(connectedIds);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`connection-requests-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "connection_requests",
      }, () => {
        fetchConnections();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConnections]);

  const sendRequest = useCallback(async (receiverId: string, message?: string) => {
    if (!user) return false;
    const { error } = await supabase.from("connection_requests").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      message: message || null,
    });
    if (!error) {
      await fetchConnections();
    }
    return !error;
  }, [user, fetchConnections]);

  const acceptRequest = useCallback(async (requestId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("receiver_id", user.id);
    if (!error) {
      await fetchConnections();
    }
    return !error;
  }, [user, fetchConnections]);

  const rejectRequest = useCallback(async (requestId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("receiver_id", user.id);
    if (!error) {
      await fetchConnections();
    }
    return !error;
  }, [user, fetchConnections]);

  const getRequestStatus = useCallback((otherUserId: string): "none" | "pending_sent" | "pending_received" | "connected" => {
    if (connections.has(otherUserId)) return "connected";
    if (pendingSent.some(r => r.receiver_id === otherUserId)) return "pending_sent";
    if (pendingReceived.some(r => r.sender_id === otherUserId)) return "pending_received";
    return "none";
  }, [connections, pendingSent, pendingReceived]);

  const isConnected = useCallback((userId: string) => connections.has(userId), [connections]);

  return {
    pendingReceived,
    pendingSent,
    connections,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    getRequestStatus,
    isConnected,
    refetch: fetchConnections,
    pendingCount: pendingReceived.length,
  };
}
