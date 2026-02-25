import { useState, useEffect, useMemo } from "react";
import { MapPin, Briefcase, Clock, Star, FileText, Image, Film, Paperclip, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation, Message } from "@/hooks/useMessages";
import { format } from "date-fns";

interface ChatRightSidebarProps {
  conversation: Conversation | undefined;
  messages: Message[];
  onViewProfile?: (userId: string) => void;
}

const getFileIconForUrl = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return Film;
  if (ext === 'pdf') return FileText;
  return Paperclip;
};

const getFileName = (url: string) => {
  const raw = decodeURIComponent(url.split('/').pop() || 'File');
  // Remove the chat-timestamp prefix
  return raw.replace(/^chat-\d+\./, '.');
};

const ChatRightSidebar = ({ conversation, messages, onViewProfile }: ChatRightSidebarProps) => {
  // Extract shared files from messages
  const sharedFiles = useMemo(() => {
    return messages
      .filter(m => m.image_url)
      .map(m => ({
        id: m.id,
        url: m.image_url!,
        date: m.created_at,
        senderId: m.sender_id,
      }))
      .reverse();
  }, [messages]);

  if (!conversation?.other_user) return null;

  const other = conversation.other_user;
  const initials = other.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <aside className="hidden lg:flex w-72 flex-col border-l border-border bg-card overflow-hidden">
      <ScrollArea className="flex-1">
        {/* Profile card */}
        <div className="flex flex-col items-center p-6 border-b border-border">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={other.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            {other.verification === "verified" && (
              <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary border-2 border-card" />
            )}
          </div>
          <h3 className="mt-3 font-display text-base font-bold">{other.full_name}</h3>
          <p className="text-xs text-muted-foreground text-center mt-0.5">
            {other.headline || `${other.industry || "Professional"}${other.company_name ? ` @ ${other.company_name}` : ""}`}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onViewProfile?.(other.user_id)}
            >
              View Profile
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Star className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Context */}
        <div className="p-5 border-b border-border space-y-4">
          <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Context</h4>

          {other.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Location</p>
                <p className="text-xs text-muted-foreground">{other.location}</p>
              </div>
            </div>
          )}

          {other.expertise && other.expertise.length > 0 && (
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Interests</p>
                <p className="text-xs text-muted-foreground">{other.expertise.join(", ")}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Connected Since</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(conversation.created_at), "MMMM yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Shared Files */}
        <div className="p-5 border-b border-border">
          <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">
            Shared Files ({sharedFiles.length})
          </h4>
          {sharedFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No files shared yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sharedFiles.slice(0, 20).map(file => {
                const Icon = getFileIconForUrl(file.url);
                const ext = file.url.split('.').pop()?.toLowerCase() || '';
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

                return (
                  <button
                    key={file.id}
                    onClick={() => window.open(file.url, "_blank")}
                    className="flex items-center gap-2.5 w-full rounded-lg p-2 text-left hover:bg-muted transition-colors group"
                  >
                    {isImage ? (
                      <img src={file.url} alt="" className="h-9 w-9 rounded object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{getFileName(file.url)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(file.date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Premium benefit */}
        <div className="p-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradient-gold text-navy text-[10px] font-semibold px-2 py-0.5">
                PREMIUM BENEFIT
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unlimited messaging to investors and high-priority reply tracking is active.
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default ChatRightSidebar;
