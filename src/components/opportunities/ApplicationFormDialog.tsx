import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: any;
  onSuccess: () => void;
}

const ApplicationFormDialog = ({ open, onOpenChange, opportunity, onSuccess }: ApplicationFormDialogProps) => {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalDocsRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [whyApply, setWhyApply] = useState("");

  const totalSteps = 3;

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10MB");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAdditionalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setAdditionalFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("application-documents")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please log in"); return; }
    if (!fullName.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setSubmitting(true);
    try {
      let resumeUrl: string | null = null;
      const additionalDocUrls: string[] = [];

      // Upload resume
      if (resumeFile) {
        const ext = resumeFile.name.split(".").pop();
        const path = `${user.id}/${opportunity.id}/resume-${Date.now()}.${ext}`;
        resumeUrl = await uploadFile(resumeFile, path);
      }

      // Upload additional docs
      for (const file of additionalFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${opportunity.id}/doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const url = await uploadFile(file, path);
        additionalDocUrls.push(url);
      }

      // Insert application
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: opportunity.id,
        user_id: user.id,
        phone: phone || null,
        cover_letter: coverLetter || null,
        resume_url: resumeUrl,
        additional_docs: additionalDocUrls,
        answers: { full_name: fullName, email, why_apply: whyApply },
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already applied to this opportunity");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Application submitted successfully!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setCoverLetter("");
    setResumeFile(null);
    setAdditionalFiles([]);
    setWhyApply("");
  };

  const canProceedStep1 = fullName.trim() && email.trim();
  const canProceedStep2 = true; // Documents are optional
  const canSubmit = canProceedStep1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) resetForm(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Apply to {opportunity?.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {opportunity?.organization} • Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <Separator />

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+233..."
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Upload Documents</h3>

            {/* Resume */}
            <div>
              <Label className="text-xs">Resume / CV</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeSelect}
                className="hidden"
              />
              {resumeFile ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs flex-1 truncate">{resumeFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setResumeFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-1 w-full gap-2 h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Upload Resume</p>
                    <p className="text-[10px] text-muted-foreground">PDF, DOC up to 10MB</p>
                  </div>
                </Button>
              )}
            </div>

            {/* Additional Documents */}
            <div>
              <Label className="text-xs">Additional Documents (max 5)</Label>
              <input
                ref={additionalDocsRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                onChange={handleAdditionalFiles}
                className="hidden"
              />
              {additionalFiles.length > 0 && (
                <div className="mt-1 space-y-1.5">
                  {additionalFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] flex-1 truncate">{file.name}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeAdditionalFile(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {additionalFiles.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1.5 text-xs"
                  onClick={() => additionalDocsRef.current?.click()}
                >
                  <Upload className="h-3 w-3" />
                  Add Document
                </Button>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Cover Letter & Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Cover Letter & Motivation</h3>

            <div>
              <Label htmlFor="whyApply" className="text-xs">Why are you applying for this opportunity? *</Label>
              <Textarea
                id="whyApply"
                value={whyApply}
                onChange={e => setWhyApply(e.target.value)}
                placeholder="Describe why you're a good fit and what you hope to achieve..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="coverLetter" className="text-xs">Additional Notes (optional)</Label>
              <Textarea
                id="coverLetter"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Any other information you'd like to share..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Review Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Application Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-1 font-medium">{fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-1 font-medium">{email}</span>
                </div>
                {phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-1 font-medium">{phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Resume:</span>
                  <span className="ml-1 font-medium">{resumeFile ? "✓ Uploaded" : "Not provided"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Documents:</span>
                  <span className="ml-1 font-medium">{additionalFiles.length} file(s)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>By submitting, you confirm that all information provided is accurate.</span>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationFormDialog;
