import { useState } from "react";
import { Shield, Upload, Linkedin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onNext: () => void;
  onSkip: () => void;
  saving: boolean;
}

const OnboardingKYCStep = ({ onNext, onSkip, saving: parentSaving }: Props) => {
  const { user } = useAuth();
  const [localSaving, setLocalSaving] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocName(file.name);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLocalSaving(true);
    try {
      let document_url: string | null = null;

      if (docFile) {
        const ext = docFile.name.split(".").pop();
        const path = `${user.id}/kyc-doc.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("application-documents")
          .upload(path, docFile, { upsert: true });
        if (uploadError) throw uploadError;
        // Store the path reference
        document_url = path;
      }

      // Create verification request
      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        linkedin_url: linkedinUrl.trim() || null,
        additional_info: additionalInfo.trim() || null,
        document_url,
        status: "pending",
      });
      if (error) throw error;

      toast.success("Verification documents submitted!");
      onNext();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLocalSaving(false);
    }
  };

  const isSaving = localSaving || parentSaving;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
          <Shield className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Identity Verification</h2>
          <p className="text-sm text-muted-foreground">Build trust in the ecosystem</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Submit your details for verification. This helps build trust with other members. You can skip this and complete it later.
      </p>

      <div className="mt-6 space-y-5">
        {/* LinkedIn URL */}
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn Profile</Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="space-y-2">
          <Label>Identity Document</Label>
          <p className="text-xs text-muted-foreground">Upload a government ID, business registration, or professional certificate</p>
          <label
            htmlFor="kyc-doc-upload"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 hover:border-gold/50 hover:bg-gold/5 transition-colors"
          >
            {docName ? (
              <>
                <FileText className="h-5 w-5 text-gold" />
                <span className="text-sm truncate">{docName}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload document</span>
              </>
            )}
          </label>
          <input
            id="kyc-doc-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleDocChange}
          />
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          <Label htmlFor="additional_info">Additional Information</Label>
          <Textarea
            id="additional_info"
            placeholder="Any additional info to support your verification..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isSaving}
          className="flex-1"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || (!linkedinUrl.trim() && !docFile)}
          className="flex-1 bg-gradient-gold font-semibold text-navy hover:opacity-90"
        >
          {isSaving ? "Submitting..." : "Submit & Continue →"}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingKYCStep;
