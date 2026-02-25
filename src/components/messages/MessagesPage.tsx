import ConversationList from "./ConversationList";
import ChatView from "./ChatView";
import ChatRightSidebar from "./ChatRightSidebar";
import { useMessages } from "@/hooks/useMessages";

const MessagesPage = () => {
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
  } = useMessages();

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 md:-mx-6 -my-6">
      {/* Conversation list */}
      <div className="w-72 shrink-0 hidden sm:flex">
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          loading={loadingConversations}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={selectConversation}
        />
      </div>

      {/* Chat view */}
      <ChatView
        conversation={activeConvoData}
        messages={messages}
        loading={loadingMessages}
        onSendMessage={sendMessage}
      />

      {/* Right sidebar */}
      <ChatRightSidebar conversation={activeConvoData} />
    </div>
  );
};

export default MessagesPage;
