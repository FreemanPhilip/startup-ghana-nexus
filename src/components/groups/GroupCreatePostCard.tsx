import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GroupCreatePostCardProps {
  onSubmit: (content: string, imageUrl?: string, videoUrl?: string) => Promise<void>;
}

const GroupCreatePostCard = ({ onSubmit }: GroupCreatePostCardProps) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const resetAll = () => {
    setContent("");
    setExpanded(false);
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-media").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("post-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be under 50MB"); return; }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !videoFile) {
      toast.error("Please add some content");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      if (imageFile) {
        const url = await uploadFile(imageFile);
        if (!url) { setSubmitting(false); return; }
        imageUrl = url;
      }
      if (videoFile) {
        const url = await uploadFile(videoFile);
        if (!url) { setSubmitting(false); return; }
        videoUrl = url;
      }

      await onSubmit(content.trim(), imageUrl, videoUrl);
      resetAll();
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoSelect} />

      {/* Compact row */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Start a post in this group...
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-around border-t border-border px-4 py-2">
        <button onClick={() => { setExpanded(true); imageInputRef.current?.click(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <ImageIcon className="h-4 w-4 text-primary" />
          Photo
        </button>
        <button onClick={() => { setExpanded(true); videoInputRef.current?.click(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Video className="h-4 w-4 text-destructive" />
          Video
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {/* Media preview */}
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {videoPreview && (
            <div className="relative">
              <video src={videoPreview} controls className="w-full max-h-64 rounded-lg" />
              <button onClick={() => { setVideoFile(null); setVideoPreview(null); }} className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Textarea
            autoFocus
            placeholder="Share an update with this group..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none border-0 bg-muted/50 focus-visible:ring-1"
          />
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={resetAll} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-gold text-navy font-semibold hover:opacity-90 gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCreatePostCard;
