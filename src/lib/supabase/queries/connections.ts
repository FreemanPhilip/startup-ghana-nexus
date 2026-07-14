import { supabase } from "@/integrations/supabase/client";
import { getProfilesByIds, type EnrichedProfile } from "./profiles";

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  sender_profile?: EnrichedProfile;
  receiver_profile?: EnrichedProfile;
}

export async function fetchConnectionRequests(userId: string): Promise<{
  pendingReceived: ConnectionRequest[];
  pendingSent: ConnectionRequest[];
  connections: Set<string>;
}> {
  const { data: requests } = await supabase
    .from("connection_requests")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!requests) return { pendingReceived: [], pendingSent: [], connections: new Set() };

  const received = requests.filter(r => r.receiver_id === userId && r.status === "pending");
  const sent = requests.filter(r => r.sender_id === userId && r.status === "pending");
  const accepted = requests.filter(r => r.status === "accepted");

  const connectedIds = new Set<string>();
  accepted.forEach(r => connectedIds.add(r.sender_id === userId ? r.receiver_id : r.sender_id));

  const allUserIds = [...new Set([...received.map(r => r.sender_id), ...sent.map(r => r.receiver_id)])];
  const profilesMap = await getProfilesByIds(allUserIds);

  return {
    pendingReceived: received.map(r => ({ ...r, sender_profile: profilesMap.get(r.sender_id) })),
    pendingSent: sent.map(r => ({ ...r, receiver_profile: profilesMap.get(r.receiver_id) })),
    connections: connectedIds,
  };
}

export async function sendConnectionRequest(senderId: string, receiverId: string, message?: string) {
  return supabase.from("connection_requests").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    message: message || null,
  });
}

export async function acceptConnectionRequest(requestId: string, receiverId: string) {
  return supabase
    .from("connection_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", receiverId);
}

export async function rejectConnectionRequest(requestId: string, receiverId: string) {
  return supabase
    .from("connection_requests")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", receiverId);
}
