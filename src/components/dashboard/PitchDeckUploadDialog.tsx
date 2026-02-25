import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface PitchDeck {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

interface PitchDeckUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PitchDeckUploadDialog = ({ open, onOpenChange }: PitchDeckUploadDialogProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDecks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("pitch_decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDecks((data as PitchDeck[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchDecks();
  }, [open, user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("pitch-decks")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("pitch_decks").insert({
        user_id: user.id,
        file_name: file.name,
        file_url: path,
        file_size: file.size,
      });
      if (dbError) throw dbError;

      toast.success("Pitch deck uploaded!");
      fetchDecks();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (deck: PitchDeck) => {
    try {
      await supabase.storage.from("pitch-decks").remove([deck.file_url]);
      await supabase.from("pitch_decks").delete().eq("id", deck.id);
      setDecks(prev => prev.filter(d => d.id !== deck.id));
      toast.success("Pitch deck deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pitch Deck Manager</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload and manage your pitch decks. These can be attached when applying to grants or investment opportunities.
          </DialogDescription>
        </DialogHeader>

        {/* Upload area */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.ppt,.doc,.docx"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full gap-2 h-20 border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <div className="text-left">
            <p className="text-xs font-medium">{uploading ? "Uploading..." : "Upload New Pitch Deck"}</p>
            <p className="text-[10px] text-muted-foreground">PDF, PPTX, DOC up to 20MB</p>
          </div>
        </Button>

        {/* Deck list */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Pitch Decks</h4>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : decks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No pitch decks uploaded yet.</p>
          ) : (
            decks.map(deck => (
              <div key={deck.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{deck.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(deck.file_size)} • {format(new Date(deck.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(deck)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PitchDeckUploadDialog;
