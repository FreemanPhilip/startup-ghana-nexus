import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";

export type { Conversation, Message } from "@/lib/supabase/queries/messages";

export function useMessages() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const {
    conversations,
    loadingConversations,
    searchQuery,
    setSearchQuery,
    startConversation,
    deleteConversation,
  } = useConversations();

  const {
    messages,
    loadingMessages,
    sendMessage,
    deleteMessage,
    deleteMessages,
    clearChat,
  } = useChatMessages(activeConversation);

  const {
    blockUser,
    unblockUser,
    isUserBlocked,
  } = useBlockedUsers();

  const selectConversation = (id: string | null) => {
    setActiveConversation(id);
  };

  const activeConvoData = conversations.find(c => c.id === activeConversation);

  return {
    conversations,
    activeConversation,
    activeConvoData,
    messages,
    loadingConversations,
    loadingMessages,
    searchQuery,
    setSearchQuery,
    selectConversation,
    sendMessage,
    startConversation,
    fetchConversations: () => {},
    deleteMessage,
    deleteMessages,
    clearChat,
    deleteConversation,
    blockUser,
    unblockUser,
    isUserBlocked,
  };
}
