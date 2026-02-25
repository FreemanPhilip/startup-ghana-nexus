import { useState, useRef, useEffect } from "react";
import { Send, Smile, Plus, MoreVertical, Video, ArrowLeft, Check, CheckCheck, Image, Paperclip, X, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import type { Message, Conversation } from "@/hooks/useMessages";
import { format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ChatScheduleMeetingDialog from "./ChatScheduleMeetingDialog";

interface ChatViewProps {
  conversation: Conversation | undefined;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string, imageUrl?: string | null) => void;
  onBack?: () => void;
}

const ChatView = ({ conversation, messages, loading, onSendMessage, onBack }: ChatViewProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !pendingFile) return;

    let imageUrl: string | null = null;

    if (pendingFile && user) {
      setUploading(true);
      const ext = pendingFile.name.split(".").pop();
      const path = `${user.id}/chat-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-media").upload(path, pendingFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      } else {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSendMessage(input, imageUrl);
    setInput("");
    setPendingFile(null);
    setPreviewImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Only images supported", description: "Please select an image file (JPG, PNG, GIF, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setShowAttachMenu(false);
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
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
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
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
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs hidden sm:flex"
            onClick={() => setScheduleOpen(true)}
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule Meeting
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:hidden"
            onClick={() => setScheduleOpen(true)}
          >
            <Calendar className="h-4 w-4" />
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
                            {/* Image attachment */}
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="Attachment"
                                className="rounded-lg max-w-full max-h-48 object-cover mb-1.5 cursor-pointer"
                                onClick={() => window.open(msg.image_url!, "_blank")}
                              />
                            )}
                            {msg.content && msg.content !== "📎 Attachment" && msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(msg.created_at), "h:mm a")}
                            </span>
                            {isMe && (
                              msg.read_at ? (
                                <CheckCheck className="h-3 w-3 text-primary" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )
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

      {/* Image preview */}
      {previewImage && (
        <div className="border-t border-border bg-card px-3 pt-2">
          <div className="relative inline-block">
            <img src={previewImage} alt="Preview" className="h-20 rounded-lg border border-border object-cover" />
            <button
              onClick={clearPendingFile}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Plus className="h-5 w-5" />
            </Button>
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                <button
                  onClick={() => { fileRef.current?.click(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Image className="h-3.5 w-3.5" /> Send Image
                </button>
                <button
                  onClick={() => { setScheduleOpen(true); setShowAttachMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" /> Schedule Meeting
                </button>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
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
            disabled={(!input.trim() && !pendingFile) || uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Schedule Meeting Dialog */}
      <ChatScheduleMeetingDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        otherUserName={otherUser?.full_name || "User"}
        otherUserId={otherUser?.user_id || ""}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatView;
