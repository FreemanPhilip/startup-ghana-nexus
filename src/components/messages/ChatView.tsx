import { useState, useRef, useEffect } from "react";
import { Send, Smile, Plus, MoreVertical, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import type { Message, Conversation } from "@/hooks/useMessages";
import { format, isToday, isYesterday } from "date-fns";

interface ChatViewProps {
  conversation: Conversation | undefined;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
}

const ChatView = ({ conversation, messages, loading, onSendMessage }: ChatViewProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string | null) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background text-center p-8">
        <div className="rounded-2xl border border-border bg-card p-10 max-w-sm">
          <h3 className="font-display text-lg font-bold mb-2">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the sidebar or start a new one from the Network tab.
          </p>
        </div>
      </div>
    );
  }

  const otherUser = conversation.other_user;

  // Group messages by date
  const groupedMessages: { label: string; msgs: Message[] }[] = [];
  let currentLabel = "";
  messages.forEach(msg => {
    const date = new Date(msg.created_at);
    let label = format(date, "MMMM d, yyyy");
    if (isToday(date)) label = "TODAY";
    else if (isYesterday(date)) label = "YESTERDAY";

    if (label !== currentLabel) {
      currentLabel = label;
      groupedMessages.push({ label, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  });

  return (
    <div className="flex flex-1 flex-col bg-background min-w-0">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs font-bold">
              {getInitials(otherUser?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{otherUser?.full_name || "User"}</p>
            <p className="text-xs text-primary font-medium">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs hidden sm:flex">
            <Video className="h-3.5 w-3.5" />
            Schedule Meeting
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : ""}`}>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? "w-48" : "w-56"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group) => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="text-[10px] font-semibold tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase">
                    {group.label}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {group.msgs.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : ""}`}>
                        {!isMe && (
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            <AvatarImage src={otherUser?.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted text-[10px] font-bold">
                              {getInitials(otherUser?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-card border border-border text-foreground rounded-bl-md"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(msg.created_at), "h:mm a")}
                            </span>
                            {isMe && msg.read_at && (
                              <span className="text-[10px] text-primary">✓✓</span>
                            )}
                          </div>
                        </div>
                        {isMe && (
                          <Avatar className="h-8 w-8 shrink-0 mt-1">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              You
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
            <Plus className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hidden sm:flex">
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
