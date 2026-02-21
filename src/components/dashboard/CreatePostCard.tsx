import { useState } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
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

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), category);
      setContent("");
      setCategory("general");
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Share an update with the ecosystem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none border-0 bg-muted/50 focus-visible:ring-1"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
            </div>
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
    </div>
  );
};

export default CreatePostCard;
