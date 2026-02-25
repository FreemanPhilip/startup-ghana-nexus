import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Video, CalendarDays, FileText, X, MapPin, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PostingIdentity } from "./AvatarDropdown";
import { useStartups } from "@/hooks/useStartups";

interface CreatePostCardProps {
  onSubmit: (content: string, category: string, imageUrl?: string, videoUrl?: string, startupId?: string) => Promise<void>;
  activeIdentity: PostingIdentity;
  onIdentityChange: (identity: PostingIdentity) => void;
}

const categories = [
  { value: "general", label: "General" },
  { value: "announcement", label: "Announcement" },
  { value: "success_story", label: "Success Story" },
  { value: "funding", label: "Funding" },
  { value: "event", label: "Event" },
  { value: "article", label: "Article" },
];

type PostMode = "default" | "photo" | "video" | "event" | "article";

const CreatePostCard = ({ onSubmit, activeIdentity, onIdentityChange }: CreatePostCardProps) => {
  const { user, profile } = useAuth();
  const { myStartups } = useStartups();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<PostMode>("default");

  // Media state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Event state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventIsVirtual, setEventIsVirtual] = useState(false);

  // Article state
  const [articleTitle, setArticleTitle] = useState("");

  const isStartup = activeIdentity.type === "startup";
  const displayName = isStartup ? activeIdentity.startup?.name : profile?.full_name;
  const displayAvatar = isStartup ? activeIdentity.startup?.logo_url : profile?.avatar_url;
  const initials = isStartup
    ? (activeIdentity.startup?.name?.charAt(0) || "S")
    : profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const resetAll = () => {
    setContent("");
    setCategory("general");
    setExpanded(false);
    setMode("default");
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setEventIsVirtual(false);
    setArticleTitle("");
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
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
    setSubmitting(true);
    try {
      let finalContent = content.trim();
      let finalCategory = category;
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      if (imageFile) {
        const url = await uploadFile(imageFile, "images");
        if (!url) { setSubmitting(false); return; }
        imageUrl = url;
      }
      if (videoFile) {
        const url = await uploadFile(videoFile, "videos");
        if (!url) { setSubmitting(false); return; }
        videoUrl = url;
      }

      if (mode === "event") {
        if (!eventTitle || !eventDate) { toast.error("Event title and date are required"); setSubmitting(false); return; }
        finalCategory = "event";
        finalContent = `📅 ${eventTitle}\n🗓 ${eventDate}${eventTime ? ` at ${eventTime}` : ""}\n${eventIsVirtual ? "💻 Virtual Event" : `📍 ${eventLocation || "TBD"}`}${finalContent ? `\n\n${finalContent}` : ""}`;
      }

      if (mode === "article") {
        if (!articleTitle) { toast.error("Article title is required"); setSubmitting(false); return; }
        finalCategory = "article";
        finalContent = `# ${articleTitle}\n\n${finalContent}`;
      }

      if (!finalContent) { toast.error("Please add some content"); setSubmitting(false); return; }

      const startupId = isStartup ? activeIdentity.startup?.id : undefined;
      await onSubmit(finalContent, finalCategory, imageUrl, videoUrl, startupId);
      resetAll();
      toast.success("Post published!");
    } catch {
      toast.error("Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  const openMode = (m: PostMode) => {
    setExpanded(true);
    setMode(m);
    if (m === "event") setCategory("event");
    else if (m === "article") setCategory("article");
  };

  const eligibleStartups = myStartups.filter(s => ["owner", "admin", "editor"].includes(s.my_role));

  return (
    <div className="rounded-xl border border-border bg-card">
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoSelect} />

      {/* Identity selector */}
      {eligibleStartups.length > 0 && (
        <div className="px-4 pt-3 pb-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                <Avatar className={`h-5 w-5 ${isStartup ? "rounded" : ""}`}>
                  <AvatarImage src={displayAvatar || undefined} />
                  <AvatarFallback className={`text-[9px] font-bold ${isStartup ? "rounded" : ""}`}>{initials}</AvatarFallback>
                </Avatar>
                <span>Posting as <span className="font-semibold">{displayName || "You"}</span></span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onIdentityChange({ type: "personal" })} className="gap-2 cursor-pointer">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px] font-bold">{profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}</AvatarFallback>
                </Avatar>
                {profile?.full_name || "Personal Profile"}
              </DropdownMenuItem>
              {eligibleStartups.map(s => (
                <DropdownMenuItem key={s.id} onClick={() => onIdentityChange({ type: "startup", startup: s })} className="gap-2 cursor-pointer">
                  <Avatar className="h-5 w-5 rounded">
                    <AvatarImage src={s.logo_url || undefined} />
                    <AvatarFallback className="text-[9px] font-bold rounded">{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {s.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Compact input row */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className={`h-10 w-10 shrink-0 ${isStartup ? "rounded-lg" : ""}`}>
          <AvatarImage src={displayAvatar || undefined} />
          <AvatarFallback className={`bg-muted text-xs font-bold ${isStartup ? "rounded-lg" : ""}`}>{initials}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => { setExpanded(true); setMode("default"); }}
          className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Start a post{isStartup ? ` as ${activeIdentity.startup?.name}` : ""}
        </button>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-around border-t border-border px-4 py-2">
        <button onClick={() => { openMode("photo"); imageInputRef.current?.click(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <ImageIcon className="h-4 w-4 text-primary" />
          Photo
        </button>
        <button onClick={() => { openMode("video"); videoInputRef.current?.click(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Video className="h-4 w-4 text-destructive" />
          Video
        </button>
        <button onClick={() => openMode("event")} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <CalendarDays className="h-4 w-4 text-secondary" />
          Event
        </button>
        <button onClick={() => openMode("article")} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <FileText className="h-4 w-4 text-accent" />
          Write article
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {mode === "event" && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-foreground">Create Event Post</p>
              <Input placeholder="Event title *" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="h-9 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-9 text-sm" />
                <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={eventIsVirtual} onCheckedChange={setEventIsVirtual} id="virtual" />
                  <Label htmlFor="virtual" className="text-xs">Virtual</Label>
                </div>
                {!eventIsVirtual && (
                  <Input placeholder="Location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="h-9 text-sm flex-1" />
                )}
              </div>
            </div>
          )}

          {mode === "article" && (
            <Input
              autoFocus
              placeholder="Article title *"
              value={articleTitle}
              onChange={e => setArticleTitle(e.target.value)}
              className="text-lg font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
            />
          )}

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
            autoFocus={mode === "default"}
            placeholder={mode === "article" ? "Write your article..." : mode === "event" ? "Add event details..." : "Share an update with the ecosystem..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={mode === "article" ? 8 : 3}
            className="resize-none border-0 bg-muted/50 focus-visible:ring-1"
          />
          <div className="flex items-center justify-between">
            {mode === "default" && (
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
            )}
            {mode !== "default" && <div />}
            <div className="flex gap-2">
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
        </div>
      )}
    </div>
  );
};

export default CreatePostCard;
