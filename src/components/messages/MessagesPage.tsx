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
          onSendMessage={sendMessage}
          onBack={handleBack}
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
