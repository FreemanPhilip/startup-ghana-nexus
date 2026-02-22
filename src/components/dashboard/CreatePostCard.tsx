import { useState } from "react";
import { Send, Image as ImageIcon, Video, CalendarDays, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreatePostCardProps {
  onSubmit: (content: string, category: string) => Promise<void>;
}

const categories = [
  { value: "general", label: "General" },
  { value: "announcement", label: "Announcement" },
  { value: "success_story", label: "Success Story" },
  { value: "funding", label: "Funding" },
  { value: "event", label: "Event" },
];

const CreatePostCard = ({ onSubmit }: CreatePostCardProps) => {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), category);
      setContent("");
      setCategory("general");
      setExpanded(false);
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Compact input row */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Start a post
        </button>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-around border-t border-border px-4 py-2">
        <button onClick={() => setExpanded(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <ImageIcon className="h-4 w-4 text-primary" />
          Photo
        </button>
        <button onClick={() => setExpanded(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Video className="h-4 w-4 text-destructive" />
          Video
        </button>
        <button onClick={() => { setExpanded(true); setCategory("event"); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <CalendarDays className="h-4 w-4 text-secondary" />
          Event
        </button>
        <button onClick={() => setExpanded(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <FileText className="h-4 w-4 text-accent" />
          Write article
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          <Textarea
            autoFocus
            placeholder="Share an update with the ecosystem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none border-0 bg-muted/50 focus-visible:ring-1"
          />
          <div className="flex items-center justify-between">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setExpanded(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="bg-gradient-gold text-navy font-semibold hover:opacity-90 gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostCard;
