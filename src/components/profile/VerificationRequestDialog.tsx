import { useState } from "react";
import { Shield, Upload, Loader2, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VerificationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VerificationRequestDialog = ({ open, onOpenChange }: VerificationRequestDialogProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/verification-doc.${ext}`;
    const { error } = await supabase.storage.from("application-documents").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("application-documents").getPublicUrl(path);
      setDocUrl(data.publicUrl);
      toast({ title: "Document uploaded" });
    } else {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      linkedin_url: linkedinUrl.trim() || null,
      document_url: docUrl,
      additional_info: additionalInfo.trim() || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Update profile verification to pending
      await supabase.from("profiles").update({ verification: "pending" } as any).eq("user_id", user.id);
      await refreshProfile();
      toast({ title: "Verification request submitted!", description: "We'll review your application and notify you." });
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Request Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Verified profiles get a badge, higher visibility, and increased trust. Submit the following to get verified:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <CheckCircle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">LinkedIn Profile</p>
                <p className="text-xs text-muted-foreground">Provide your LinkedIn URL for identity validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <CheckCircle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Identity / Business Document</p>
                <p className="text-xs text-muted-foreground">Upload a valid ID, business registration, or certificate</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">LinkedIn URL *</Label>
            <Input
              placeholder="https://linkedin.com/in/your-profile"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Upload Document</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                <label>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {docUrl ? "Replace Document" : "Choose File"}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocUpload} />
                </label>
              </Button>
              {docUrl && <Badge className="text-[10px] bg-secondary/10 text-secondary border-0">Uploaded ✓</Badge>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Additional Information (optional)</Label>
            <Textarea
              placeholder="Any additional details that support your verification..."
              value={additionalInfo}
              onChange={e => setAdditionalInfo(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            className="w-full text-sm font-semibold gap-1.5"
            onClick={handleSubmit}
            disabled={submitting || !linkedinUrl.trim()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Submit Verification Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationRequestDialog;
