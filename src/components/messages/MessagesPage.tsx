import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import ChatRightSidebar from "./ChatRightSidebar";
import NewConversationDialog from "./NewConversationDialog";
import { useMessages } from "@/hooks/useMessages";
interface MessagesPageProps {
  onViewProfile?: (userId: string) => void;
}

const MessagesPage = ({ onViewProfile }: MessagesPageProps) => {
  const {
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
    deleteMessage,
    deleteMessages,
    clearChat,
    deleteConversation,
    blockUser,
    unblockUser,
    isUserBlocked,
  } = useMessages();

  const [newConvoOpen, setNewConvoOpen] = useState(false);

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
  };

  const handleBack = () => {
    selectConversation(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 md:-mx-6 -my-6">
      {/* Conversation list: full screen on mobile when no active convo, sidebar on desktop */}
      <div
        className={`${
          activeConversation
            ? "hidden sm:flex w-72 shrink-0"
            : "flex w-full sm:w-72 sm:shrink-0"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          loading={loadingConversations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={handleSelectConversation}
          onNewConversation={() => setNewConvoOpen(true)}
        />
      </div>

      {/* Chat view: full screen on mobile when active convo, flex on desktop */}
      <div
        className={`${
          activeConversation
            ? "flex flex-1 min-w-0"
            : "hidden sm:flex flex-1 min-w-0"
        }`}
      >
        <ChatView
          conversation={activeConvoData}
          messages={messages}
          loading={loadingMessages}
          onSendMessage={(content: string, imageUrl?: string) => {
            void sendMessage({ content, imageUrl });
          }}
          onBack={handleBack}
          onDeleteMessage={async (messageId: string) => {
            try { await deleteMessage(messageId); return true; } catch { return false; }
          }}
          onDeleteMessages={async (messageIds: string[]) => {
            try { await deleteMessages(messageIds); return true; } catch { return false; }
          }}
          onClearChat={async () => {
            try { await clearChat(); return true; } catch { return false; }
          }}
          onDeleteConversation={async (conversationId: string) => {
            try { await deleteConversation(conversationId); return true; } catch { return false; }
          }}
          onBlockUser={async (userId: string) => {
            try { await blockUser(userId); return true; } catch { return false; }
          }}
          onUnblockUser={async (userId: string) => {
            try { await unblockUser(userId); return true; } catch { return false; }
          }}
          isUserBlocked={isUserBlocked}
        />
      </div>

      {/* Right sidebar */}
      <ChatRightSidebar
        conversation={activeConvoData}
        messages={messages}
        onViewProfile={(userId) => onViewProfile?.(userId)}
      />

      {/* New conversation dialog */}
      <NewConversationDialog
        open={newConvoOpen}
        onOpenChange={setNewConvoOpen}
        onStartConversation={startConversation}
      />
    </div>
  );
};

export default MessagesPage;
