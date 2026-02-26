import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Plus, MoreVertical, Video, ArrowLeft, Check, CheckCheck, Image, Paperclip, X, Calendar, Loader2, Trash2, Eraser, Ban, CheckSquare, Square, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import type { Message, Conversation } from "@/hooks/useMessages";
import { format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ChatScheduleMeetingDialog from "./ChatScheduleMeetingDialog";
import LinkPreviewCard from "./LinkPreviewCard";
import EmojiPicker from "./EmojiPicker";
import { formatLastSeen } from "@/hooks/usePresence";

interface ChatViewProps {
  conversation: Conversation | undefined;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string, imageUrl?: string | null) => void;
  onBack?: () => void;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onDeleteMessages?: (messageIds: string[]) => Promise<boolean>;
  onClearChat?: () => Promise<boolean>;
  onDeleteConversation?: (conversationId: string) => Promise<boolean>;
  onBlockUser?: (userId: string) => Promise<boolean>;
  onUnblockUser?: (userId: string) => Promise<boolean>;
  isUserBlocked?: (userId: string) => Promise<boolean>;
}

const ChatView = ({ conversation, messages, loading, onSendMessage, onBack, onDeleteMessage, onDeleteMessages, onClearChat, onDeleteConversation, onBlockUser, onUnblockUser, isUserBlocked }: ChatViewProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState(false);
  const [otherUserPresence, setOtherUserPresence] = useState<{ is_online: boolean; last_seen: string | null }>({ is_online: false, last_seen: null });
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingBroadcast = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  // Check block status
  useEffect(() => {
    const checkBlocked = async () => {
      if (!conversation?.other_user?.user_id || !isUserBlocked) return;
      const b = await isUserBlocked(conversation.other_user.user_id);
      setBlocked(b);
    };
    checkBlocked();
  }, [conversation?.other_user?.user_id, isUserBlocked]);

  // Reset select mode when conversation changes
  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [conversation?.id]);

  const toggleSelect = (msgId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const myMessages = messages.filter(m => m.sender_id === user?.id);
  const selectAllMine = () => setSelectedIds(new Set(myMessages.map(m => m.id)));
  const deselectAll = () => setSelectedIds(new Set());

  // Fetch and subscribe to other user's presence
  useEffect(() => {
    const otherUserId = conversation?.other_user?.user_id;
    if (!otherUserId) return;

    const fetchPresence = async () => {
      const { data } = await supabase
        .from("user_presence")
        .select("is_online, last_seen")
        .eq("user_id", otherUserId)
        .maybeSingle();
      if (data) setOtherUserPresence({ is_online: data.is_online, last_seen: data.last_seen });
    };
    fetchPresence();

    const channel = supabase
      .channel(`presence-${otherUserId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_presence",
        filter: `user_id=eq.${otherUserId}`,
      }, (payload: any) => {
        const row = payload.new;
        if (row) setOtherUserPresence({ is_online: row.is_online, last_seen: row.last_seen });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation?.other_user?.user_id]);

  // Typing indicator channel
  useEffect(() => {
    if (!conversation?.id || !user) return;
    const channelName = `typing-${conversation.id}`;
    const channel = supabase.channel(channelName)
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload?.user_id !== user.id) {
          setIsOtherTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      clearTimeout(typingTimeoutRef.current);
      setIsOtherTyping(false);
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, user]);

  const broadcastTyping = useCallback(() => {
    if (!conversation?.id || !user) return;
    const now = Date.now();
    if (now - lastTypingBroadcast.current < 2000) return; // throttle to 2s
    lastTypingBroadcast.current = now;
    supabase.channel(`typing-${conversation.id}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
  }, [conversation?.id, user]);

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

  const ALLOWED_TYPES = [
    "image/", "video/", "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
    "text/plain", "text/csv",
  ];

  const isAllowedFile = (type: string) => ALLOWED_TYPES.some(t => type.startsWith(t));

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎬";
    if (type === "application/pdf") return "📄";
    if (type.startsWith("application/vnd.ms-excel") || type.includes("spreadsheet")) return "📊";
    if (type.startsWith("application/vnd.ms-powerpoint") || type.includes("presentation")) return "📽️";
    if (type.startsWith("application/msword") || type.includes("document")) return "📝";
    return "📎";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedFile(file.type)) {
      toast({ title: "Unsupported file type", description: "Supported: images, videos, PDFs, Word, Excel, PowerPoint, text files.", variant: "destructive" });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 25MB", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setPreviewImage(null);
    }
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
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-xs font-bold">
                {getInitials(otherUser?.full_name)}
              </AvatarFallback>
            </Avatar>
            {otherUserPresence.is_online && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{otherUser?.full_name || "User"}</p>
            <p className={`text-xs font-medium ${otherUserPresence.is_online ? "text-green-500" : "text-muted-foreground"}`}>
              {formatLastSeen(otherUserPresence.last_seen, otherUserPresence.is_online)}
            </p>
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
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChatMenu(!showChatMenu)}>
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showChatMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl p-1 z-[60] min-w-[180px]">
                <button
                  onClick={() => { setSelectMode(true); setShowChatMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <CheckSquare className="h-3.5 w-3.5" /> Select Messages
                </button>
                <button
                  onClick={() => { setConfirmClear(true); setShowChatMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Eraser className="h-3.5 w-3.5" /> Clear My Messages
                </button>
                <button
                  onClick={() => { setConfirmBlock(true); setShowChatMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Ban className="h-3.5 w-3.5" /> {blocked ? "Unblock User" : "Block User"}
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => { setConfirmDelete(true); setShowChatMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Select mode toolbar */}
      {selectMode && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setSelectMode(false); deselectAll(); }}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={selectAllMine}>
              <CheckSquare className="h-3.5 w-3.5" /> Select All Mine
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={deselectAll} disabled={selectedIds.size === 0}>
              <Square className="h-3.5 w-3.5" /> Deselect All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmBulkDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

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
                    const isSelected = selectedIds.has(msg.id);
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isMe ? "justify-end" : ""} group/msg relative ${isSelected ? "bg-primary/5 rounded-lg" : ""}`}
                        onMouseEnter={() => !selectMode && setHoveredMessageId(msg.id)}
                        onMouseLeave={() => !selectMode && setHoveredMessageId(null)}
                        onClick={selectMode && isMe ? () => toggleSelect(msg.id) : undefined}
                      >
                        {/* Selection checkbox */}
                        {selectMode && isMe && (
                          <div className="self-center shrink-0">
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(msg.id)} className="h-4 w-4" />
                          </div>
                        )}
                        {selectMode && !isMe && <div className="w-4 shrink-0" />}
                        {!selectMode && isMe && hoveredMessageId === msg.id && onDeleteMessage && (
                          <button
                            onClick={async () => {
                              await onDeleteMessage(msg.id);
                              toast({ title: "Message deleted" });
                            }}
                            className="self-center opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        )}
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
                            {/* File attachment */}
                            {msg.image_url && (() => {
                              const url = msg.image_url!;
                              const ext = url.split('.').pop()?.toLowerCase() || '';
                              const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
                              const isVideo = ['mp4','webm','mov','avi'].includes(ext);
                              if (isImage) return (
                                <img src={url} alt="Attachment" className="rounded-lg max-w-full max-h-48 object-cover mb-1.5 cursor-pointer" onClick={() => window.open(url, "_blank")} />
                              );
                              if (isVideo) return (
                                <video src={url} controls className="rounded-lg max-w-full max-h-48 mb-1.5" />
                              );
                              const fileName = decodeURIComponent(url.split('/').pop() || 'File');
                              return (
                                <button onClick={() => window.open(url, "_blank")} className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-1.5 text-xs font-medium ${isMe ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-muted hover:bg-muted/80'} transition-colors`}>
                                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate max-w-[180px]">{fileName}</span>
                                </button>
                              );
                            })()}
                            {msg.content && msg.content !== "📎 Attachment" && (
                              <span>
                                {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                                  /^https?:\/\//.test(part) ? (
                                    <a
                                      key={i}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`underline break-all font-medium ${
                                        isMe ? "text-primary-foreground/90 hover:text-primary-foreground" : "text-primary hover:text-primary/80"
                                      }`}
                                    >
                                      {part.length > 50 ? part.slice(0, 50) + "…" : part}
                                    </a>
                                  ) : (
                                    <span key={i}>{part}</span>
                                  )
                                )}
                              </span>
                            )}
                            {/* Link preview cards */}
                            {msg.content && (() => {
                              const urls = msg.content.match(/https?:\/\/[^\s]+/g);
                              if (!urls || urls.length === 0) return null;
                              return urls.map((url, i) => (
                                <LinkPreviewCard key={`lp-${i}`} url={url} isMe={isMe} />
                              ));
                            })()}
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

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-[8px] font-bold">
                {getInitials(otherUser?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-muted-foreground">typing...</span>
          </div>
        )}
      </ScrollArea>

      {/* File preview */}
      {pendingFile && (
        <div className="border-t border-border bg-card px-3 pt-2 pb-1">
          <div className="relative inline-block">
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="h-20 rounded-lg border border-border object-cover" />
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs">
                <span className="text-lg">{getFileIcon(pendingFile.type)}</span>
                <div className="flex flex-col">
                  <span className="font-medium truncate max-w-[200px]">{pendingFile.name}</span>
                  <span className="text-muted-foreground">{(pendingFile.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
            )}
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
      {blocked ? (
        <div className="border-t border-border bg-muted/50 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Ban className="h-4 w-4" />
            <span>You have blocked this user. <button className="text-primary underline" onClick={() => setConfirmBlock(true)}>Unblock</button> to send messages.</span>
          </div>
        </div>
      ) : (
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
              <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-xl p-1.5 z-[60] min-w-[170px]">
                <button
                  onClick={() => { imageRef.current?.click(); setShowAttachMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Image className="h-3.5 w-3.5" /> Photo / Video
                </button>
                <button
                  onClick={() => { docRef.current?.click(); setShowAttachMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Paperclip className="h-3.5 w-3.5" /> Document
                </button>
              </div>
            )}
          </div>
          <input ref={imageRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileSelect} />
          <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleFileSelect} />
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9"
          />
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  setInput(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
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
      )}

      {/* Schedule Meeting Dialog */}
      <ChatScheduleMeetingDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        otherUserName={otherUser?.full_name || "User"}
        otherUserId={otherUser?.user_id || ""}
        onSendMessage={onSendMessage}
      />

      {/* Clear Chat Confirmation */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="font-semibold text-sm">Clear your messages?</h3>
            <p className="text-xs text-muted-foreground mt-2">
              This will delete all messages you sent in this conversation. The other person's messages will remain.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={async () => {
                if (onClearChat) {
                  const ok = await onClearChat();
                  if (ok) toast({ title: "Your messages cleared" });
                }
                setConfirmClear(false);
              }}>Clear Messages</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="font-semibold text-sm">Delete this conversation?</h3>
            <p className="text-xs text-muted-foreground mt-2">
              This will permanently delete this conversation and all your messages in it. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={async () => {
                if (onDeleteConversation && conversation) {
                  const ok = await onDeleteConversation(conversation.id);
                  if (ok) toast({ title: "Conversation deleted" });
                }
                setConfirmDelete(false);
              }}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Confirmation */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-sm">{blocked ? "Unblock" : "Block"} {otherUser?.full_name || "this user"}?</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {blocked
                ? "You will be able to send and receive messages from this user again."
                : "They won't be able to send you messages, and you won't be able to message them. You can unblock them later."}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setConfirmBlock(false)}>Cancel</Button>
              <Button variant={blocked ? "default" : "destructive"} size="sm" onClick={async () => {
                if (blocked && onUnblockUser && otherUser) {
                  const ok = await onUnblockUser(otherUser.user_id);
                  if (ok) { setBlocked(false); toast({ title: "User unblocked" }); }
                } else if (!blocked && onBlockUser && otherUser) {
                  const ok = await onBlockUser(otherUser.user_id);
                  if (ok) { setBlocked(true); toast({ title: "User blocked", description: "They can no longer message you." }); }
                }
                setConfirmBlock(false);
              }}>{blocked ? "Unblock" : "Block"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="font-semibold text-sm">Delete {selectedIds.size} message{selectedIds.size > 1 ? "s" : ""}?</h3>
            <p className="text-xs text-muted-foreground mt-2">
              This will permanently delete the selected messages. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={async () => {
                if (onDeleteMessages) {
                  const ok = await onDeleteMessages(Array.from(selectedIds));
                  if (ok) {
                    toast({ title: `${selectedIds.size} message${selectedIds.size > 1 ? "s" : ""} deleted` });
                    deselectAll();
                    setSelectMode(false);
                  }
                }
                setConfirmBulkDelete(false);
              }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
