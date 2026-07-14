import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMessages as fetchMessagesQuery,
  sendMessage as sendMessageQuery,
  markMessagesAsRead,
  deleteMessage as deleteMessageQuery,
  deleteMessages as deleteMessagesQuery,
  clearChat as clearChatQuery,
  type Message,
} from "@/lib/supabase/queries/messages";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";

export function useChatMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const msgs = await fetchMessagesQuery(conversationId!);
      if (user) {
        await markMessagesAsRead(conversationId!, user.id);
      }
      return msgs;
    },
    enabled: !!conversationId,
  });

  useRealtimeSubscription(
    { table: "messages", filter: `conversation_id=eq.${conversationId}` },
    () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
    !!conversationId
  );

  const sendMessage = useMutation({
    mutationFn: ({ content, imageUrl }: { content: string; imageUrl?: string | null }) =>
      sendMessageQuery(conversationId!, user!.id, content, imageUrl),
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId: string) => deleteMessageQuery(messageId, user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });

  const deleteMessages = useMutation({
    mutationFn: (messageIds: string[]) => deleteMessagesQuery(messageIds, user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });

  const clearChat = useMutation({
    mutationFn: () => clearChatQuery(conversationId!, user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });

  return {
    messages,
    loadingMessages: isLoading,
    sendMessage: sendMessage.mutateAsync,
    deleteMessage: deleteMessage.mutateAsync,
    deleteMessages: deleteMessages.mutateAsync,
    clearChat: clearChat.mutateAsync,
  };
}
