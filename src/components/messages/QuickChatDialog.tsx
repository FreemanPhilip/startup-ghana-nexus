import { useState } from "react";
import { X, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMessages, type Message } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { useEffect, useRef } from "react";

interface QuickChatDialogProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string | null;
  onOpenFullChat?: () => void;
}

const QuickChatDialog = ({
  open,
  onClose,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  onOpenFullChat,
}: QuickChatDialogProps) => {
  const { user } = useAuth();
  const { startConversation, messages, sendMessage, selectConversation, activeConversation } = useMessages();
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initials = targetUserName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  useEffect(() => {
    if (open && targetUserId) {
      setInitializing(true);
      startConversation(targetUserId).then((id) => {
        setConversationId(id);
        if (id) selectConversation(id);
        setInitializing(false);
      });
    }
    return () => {
      if (!open) {
        setConversationId(null);
        setInput("");
      }
    };
  }, [open, targetUserId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { label: string; msgs: Message[] }[] = [];
  let currentLabel = "";
  const convMessages = conversationId ? messages.filter(m => m.conversation_id === conversationId || activeConversation === conversationId) : [];
  
  convMessages.forEach((msg) => {
    const date = new Date(msg.created_at);
    let label = format(date, "MMMM d, yyyy");
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";

    if (label !== currentLabel) {
      currentLabel = label;
      groupedMessages.push({ label, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={targetUserAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{targetUserName}</p>
              <p className="text-[10px] text-primary font-medium">Quick Chat</p>
            </div>
          </div>
          {onOpenFullChat && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                onOpenFullChat();
                onClose();
              }}
            >
              Open Full Chat
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3 min-h-[250px] max-h-[400px]" ref={scrollRef}>
          {initializing ? (
            <div className="flex items-center justify-center h-full py-10">
              <p className="text-xs text-muted-foreground">Starting conversation...</p>
            </div>
          ) : convMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full py-10">
              <p className="text-sm text-muted-foreground">Say hello to {targetUserName}! 👋</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMessages.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center justify-center my-2">
                    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground bg-muted px-3 py-0.5 rounded-full uppercase">
                      {group.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.msgs.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-2xl px-3 py-2 text-sm ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(msg.created_at), "h:mm a")}
                              </span>
                              {isMe && msg.read_at && (
                                <span className="text-[10px] text-primary">✓✓</span>
                              )}
                              {isMe && !msg.read_at && (
                                <span className="text-[10px] text-muted-foreground">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-9"
              disabled={initializing}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={handleSend}
              disabled={!input.trim() || initializing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickChatDialog;
