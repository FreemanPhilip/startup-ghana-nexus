import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Loader2, Sparkles, FileText, Upload, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface PitchDeck {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

interface RequestIntroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorName: string;
  onSend: (message: string, startup?: string, pitchDeckUrl?: string) => Promise<boolean>;
  startups?: { id: string; name: string }[];
}

const introTemplates = [
  "I'd love to connect and share how my startup aligns with your investment thesis.",
  "I'm building in a space you actively invest in and would welcome the opportunity to discuss potential synergies.",
  "Our traction metrics match your investment criteria. I'd appreciate a brief intro call to explore fit.",
];

const RequestIntroDialog = ({ open, onOpenChange, investorName, onSend, startups }: RequestIntroDialogProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedStartup, setSelectedStartup] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Pitch deck state
  const [existingDecks, setExistingDecks] = useState<PitchDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [selectedDeckUrl, setSelectedDeckUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing pitch decks
  useEffect(() => {
    if (!open || !user) return;
    const fetchDecks = async () => {
      setLoadingDecks(true);
      const { data } = await supabase
        .from("pitch_decks")
        .select("id, file_name, file_url, file_size, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setExistingDecks(data || []);
      setLoadingDecks(false);
    };
    fetchDecks();
  }, [open, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("pitch-decks")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("pitch-decks").getPublicUrl(filePath);

    // Save to pitch_decks table
    await supabase.from("pitch_decks").insert({
      user_id: user.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
    });

    setSelectedDeckUrl(urlData.publicUrl);
    setUploadedFileName(file.name);
    setUploading(false);

    // Refresh list
    const { data: refreshed } = await supabase
      .from("pitch_decks")
      .select("id, file_name, file_url, file_size, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setExistingDecks(refreshed || []);

    toast({ title: "Pitch deck uploaded", description: file.name });
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    const ok = await onSend(message, selectedStartup || undefined, selectedDeckUrl || undefined);
    setSending(false);
    if (ok) {
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setMessage("");
        setSelectedStartup("");
        setSelectedDeckUrl("");
        setUploadedFileName("");
      }, 1500);
    }
  };

  const applyTemplate = (t: string) => setMessage(t);

  const clearDeck = () => {
    setSelectedDeckUrl("");
    setUploadedFileName("");
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Request Intro — {investorName}
          </DialogTitle>
          <DialogDescription>
            Send a personalized introduction request with your pitch deck to increase your chances.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Send className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="font-semibold">Intro Request Sent!</p>
            <p className="text-sm text-muted-foreground mt-1">You'll be notified when they respond.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Startup selector */}
            {startups && startups.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reaching out on behalf of</Label>
                <Select value={selectedStartup} onValueChange={setSelectedStartup}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select your startup (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {startups.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pitch Deck Section */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <FileText className="h-3 w-3 text-primary" /> Attach Pitch Deck
              </Label>

              {/* Selected deck indicator */}
              {selectedDeckUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {uploadedFileName || existingDecks.find(d => d.file_url === selectedDeckUrl)?.file_name || "Pitch Deck"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Attached to request</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={clearDeck}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Existing decks */}
                  {loadingDecks ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading your pitch decks...
                    </div>
                  ) : existingDecks.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Your Uploaded Decks</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {existingDecks.map(deck => (
                          <button
                            key={deck.id}
                            onClick={() => {
                              setSelectedDeckUrl(deck.file_url);
                              setUploadedFileName(deck.file_name);
                            }}
                            className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                          >
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{deck.file_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatSize(deck.file_size)} · {new Date(deck.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Check className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Upload new */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.ppt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="h-3.5 w-3.5" /> Upload New Pitch Deck</>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">PDF, PPTX, DOC · Max 10MB</p>
                </div>
              )}
            </div>

            {/* Quick templates */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Quick Templates
              </Label>
              <div className="flex flex-col gap-1.5">
                {introTemplates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(t)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                  >
                    "{t}"
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your Message</Label>
              <Textarea
                placeholder="Write a compelling intro about yourself and your startup..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="text-sm resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{message.length}/500</p>
            </div>

            <Button
              className="w-full gap-2 font-semibold"
              disabled={!message.trim() || sending}
              onClick={handleSend}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Intro Request{selectedDeckUrl ? " with Pitch Deck" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestIntroDialog;
