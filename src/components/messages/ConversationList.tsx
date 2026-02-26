import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: string | null;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onNewConversation?: () => void;
}

const ConversationList = ({
  conversations,
  activeConversation,
  loading,
  searchQuery,
  onSearchChange,
  onSelect,
  onNewConversation,
}: ConversationListProps) => {
  const getInitials = (name: string | null) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold">Messaging Center</h2>
          {onNewConversation && (
            <Button
              size="icon"
              variant="default"
              className="h-8 w-8 rounded-full shrink-0"
              onClick={onNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No conversations found" : "No messages yet. Start a conversation from the Network tab!"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1.5">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                  activeConversation === c.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.other_user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-xs font-bold">
                      {getInitials(c.other_user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {c.other_user?.verification === "verified" && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">
                      {c.other_user?.full_name || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unread_count > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {c.last_message || "Start a conversation..."}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground shrink-0">
                    {c.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
