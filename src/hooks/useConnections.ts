import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchConnectionRequests,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  type ConnectionRequest,
} from "@/lib/supabase/queries/connections";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export function useConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: () => fetchConnectionRequests(user!.id),
    enabled: !!user,
  });

  const pendingReceived = data?.pendingReceived ?? [];
  const pendingSent = data?.pendingSent ?? [];
  const connections = data?.connections ?? new Set<string>();

  useRealtimeSubscription(
    { table: "connection_requests" },
    () => queryClient.invalidateQueries({ queryKey: ["connections", user?.id] }),
    !!user
  );

  const sendRequest = useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message?: string }) =>
      sendConnectionRequest(user!.id, receiverId, message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["connections", user?.id] }),
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId: string) => acceptConnectionRequest(requestId, user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["connections", user?.id] }),
  });

  const rejectRequest = useMutation({
    mutationFn: (requestId: string) => rejectConnectionRequest(requestId, user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["connections", user?.id] }),
  });

  const getRequestStatus = (otherUserId: string): "none" | "pending_sent" | "pending_received" | "connected" => {
    if (connections.has(otherUserId)) return "connected";
    if (pendingSent.some(r => r.receiver_id === otherUserId)) return "pending_sent";
    if (pendingReceived.some(r => r.sender_id === otherUserId)) return "pending_received";
    return "none";
  };

  const isConnected = (userId: string) => connections.has(userId);

  return {
    pendingReceived,
    pendingSent,
    connections,
    loading: isLoading,
    sendRequest: sendRequest.mutateAsync,
    acceptRequest: acceptRequest.mutateAsync,
    rejectRequest: rejectRequest.mutateAsync,
    getRequestStatus,
    isConnected,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["connections", user?.id] }),
    pendingCount: pendingReceived.length,
  };
}
