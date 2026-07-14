import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchConversations as fetchConversationsQuery,
  startConversation as startConversationQuery,
  deleteConversation as deleteConversationQuery,
  type Conversation,
} from "@/lib/supabase/queries/messages";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchConversationsQuery(user!.id),
    enabled: !!user,
  });

  useRealtimeSubscription(
    { table: "conversations" },
    () => queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] }),
    !!user
  );

  useRealtimeSubscription(
    { table: "messages" },
    () => queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] }),
    !!user
  );

  const startConversation = useMutation({
    mutationFn: (otherUserId: string) => startConversationQuery(user!.id, otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (conversationId: string) => deleteConversationQuery(conversationId, user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] }),
  });

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = c.other_user?.full_name?.toLowerCase() ?? "";
    return name.includes(searchQuery.toLowerCase());
  });

  return {
    conversations: filteredConversations,
    loadingConversations: isLoading,
    searchQuery,
    setSearchQuery,
    startConversation: startConversation.mutateAsync,
    deleteConversation: deleteConversation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] }),
  };
}
