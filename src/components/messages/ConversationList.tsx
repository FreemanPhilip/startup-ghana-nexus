import { Search, SquarePen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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

/** "2 hours" reads long in a 44px column; every inbox shortens it. */
const shortTime = (iso: string) => {
  const d = formatDistanceToNow(new Date(iso), { addSuffix: false });
  return d
    .replace(/^about |^almost |^over /, "")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
    .replace("less than am", "now");
};

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
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        {/* "Messaging Center" was a product name for a screen the member
            reached by clicking "Messages". */}
        <h2 className="page-title">Messages</h2>
        {onNewConversation && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onNewConversation}
            aria-label="New conversation"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search"
            className="h-9 rounded-full border-transparent bg-muted pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

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
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium">{searchQuery ? "No matches" : "No messages yet"}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {searchQuery ? "Try a different name." : "Start one from anyone's profile."}
            </p>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => {
              const active = activeConversation === c.id;
              const unread = c.unread_count > 0;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? "true" : undefined}
                    // A tinted, bordered box for the open thread made the list
                    // look like a stack of cards. A flat wash reads as
                    // selection without adding an edge to every row.
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={c.other_user?.avatar_url || undefined} alt="" />
                      <AvatarFallback className="bg-muted text-xs font-semibold">
                        {getInitials(c.other_user?.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[14px] ${unread ? "font-semibold" : "font-medium"}`}>
                          {c.other_user?.full_name || "User"}
                        </span>
                        <span className="shrink-0 text-[12px] text-muted-foreground">
                          {shortTime(c.last_message_at)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-[13px] ${
                          unread ? "font-medium text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {c.last_message || "No messages yet"}
                      </p>
                    </div>

                    {/* A dot, not a count. The number is already one tap away,
                        and a row of coloured badges down the list competes
                        with the names. */}
                    {unread && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-brand"
                        aria-label={`${c.unread_count} unread`}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
