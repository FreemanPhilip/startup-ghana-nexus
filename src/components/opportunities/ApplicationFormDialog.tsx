import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: any;
  onSuccess: () => void;
}

interface PitchDeck {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
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

  // Pitch deck state
  const [pitchDeckSource, setPitchDeckSource] = useState<"upload" | "existing" | null>(null);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [existingDecks, setExistingDecks] = useState<PitchDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const pitchDeckInputRef = useRef<HTMLInputElement>(null);

  const isJobType = opportunity?.type === "job";
  const totalSteps = 3;

  // Fetch existing pitch decks when on step 2 and not job type
  useEffect(() => {
    if (step === 2 && !isJobType && user) {
      setLoadingDecks(true);
      supabase
        .from("pitch_decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setExistingDecks((data as PitchDeck[]) || []);
          setLoadingDecks(false);
        });
    }
  }, [step, isJobType, user]);

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
      setResumeFile(file);
    }
  };

  const handlePitchDeckSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB"); return; }
      setPitchDeckFile(file);
      setPitchDeckSource("upload");
      setSelectedDeckId(null);
    }
  };

  const selectExistingDeck = (deck: PitchDeck) => {
    setSelectedDeckId(deck.id);
    setPitchDeckSource("existing");
    setPitchDeckFile(null);
  };

  const handleAdditionalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} exceeds 10MB limit`); return false; }
      return true;
    });
    setAdditionalFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please log in"); return; }
    if (!fullName.trim() || !email.trim()) { toast.error("Name and email are required"); return; }

    setSubmitting(true);
    try {
      let resumeUrl: string | null = null;
      const additionalDocUrls: string[] = [];

      if (isJobType && resumeFile) {
        const ext = resumeFile.name.split(".").pop();
        const path = `${user.id}/${opportunity.id}/resume-${Date.now()}.${ext}`;
        resumeUrl = await uploadFile(resumeFile, "application-documents", path);
      }

      // Handle pitch deck for non-job types
      if (!isJobType) {
        if (pitchDeckSource === "upload" && pitchDeckFile) {
          const ext = pitchDeckFile.name.split(".").pop();
          const path = `${user.id}/${opportunity.id}/pitchdeck-${Date.now()}.${ext}`;
          resumeUrl = await uploadFile(pitchDeckFile, "application-documents", path);
        } else if (pitchDeckSource === "existing" && selectedDeckId) {
          const deck = existingDecks.find(d => d.id === selectedDeckId);
          if (deck) resumeUrl = deck.file_url;
        }
      }

      for (const file of additionalFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${opportunity.id}/doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const url = await uploadFile(file, "application-documents", path);
        additionalDocUrls.push(url);
      }

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
        if (error.code === "23505") { toast.error("You have already applied to this opportunity"); }
        else throw error;
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
    setPitchDeckFile(null);
    setPitchDeckSource(null);
    setSelectedDeckId(null);
  };

  const canProceedStep1 = fullName.trim() && email.trim();
  const canSubmit = canProceedStep1;

  const selectedDeck = existingDecks.find(d => d.id === selectedDeckId);
  const docLabel = isJobType ? "Resume / CV" : "Pitch Deck";
  const hasMainDoc = isJobType ? !!resumeFile : (!!pitchDeckFile || !!selectedDeckId);

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
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
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
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs">Email Address *</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233..." className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">
              {isJobType ? "Upload Your CV / Resume" : "Attach Your Pitch Deck"}
            </h3>

            {isJobType ? (
              /* ========== JOB: CV Upload ========== */
              <div>
                <Label className="text-xs">Resume / CV</Label>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="hidden" />
                {resumeFile ? (
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs flex-1 truncate">{resumeFile.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setResumeFile(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="mt-1 w-full gap-2 h-20 border-dashed" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    <div className="text-left">
                      <p className="text-xs font-medium">Upload Resume</p>
                      <p className="text-[10px] text-muted-foreground">PDF, DOC up to 10MB</p>
                    </div>
                  </Button>
                )}
              </div>
            ) : (
              /* ========== GRANT/FUNDING/ACCELERATOR: Pitch Deck ========== */
              <div className="space-y-3">
                {/* Option 1: Upload new */}
                <div>
                  <Label className="text-xs">Upload a new pitch deck</Label>
                  <input ref={pitchDeckInputRef} type="file" accept=".pdf,.pptx,.ppt,.doc,.docx" onChange={handlePitchDeckSelect} className="hidden" />
                  {pitchDeckSource === "upload" && pitchDeckFile ? (
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs flex-1 truncate">{pitchDeckFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setPitchDeckFile(null); setPitchDeckSource(null); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className={`mt-1 w-full gap-2 h-16 border-dashed ${pitchDeckSource === "existing" ? "opacity-60" : ""}`}
                      onClick={() => pitchDeckInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      <div className="text-left">
                        <p className="text-xs font-medium">Upload from Computer</p>
                        <p className="text-[10px] text-muted-foreground">PDF, PPTX up to 20MB</p>
                      </div>
                    </Button>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">or</span>
                  <Separator className="flex-1" />
                </div>

                {/* Option 2: Select from existing */}
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Use an existing pitch deck
                  </Label>
                  {loadingDecks ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : existingDecks.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
                      No pitch decks uploaded yet. Use the <strong>Pitch Deck Upload</strong> button in the sidebar to add one.
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1.5 max-h-36 overflow-y-auto">
                      {existingDecks.map(deck => (
                        <button
                          key={deck.id}
                          onClick={() => selectExistingDeck(deck)}
                          className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                            selectedDeckId === deck.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <FileText className={`h-4 w-4 shrink-0 ${selectedDeckId === deck.id ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{deck.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(deck.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          {selectedDeckId === deck.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Documents */}
            <div>
              <Label className="text-xs">Additional Documents (max 5)</Label>
              <input ref={additionalDocsRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" multiple onChange={handleAdditionalFiles} className="hidden" />
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
                <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs" onClick={() => additionalDocsRef.current?.click()}>
                  <Upload className="h-3 w-3" /> Add Document
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
            <h3 className="font-semibold text-sm">
              {isJobType ? "Cover Letter & Motivation" : "Motivation & Review"}
            </h3>

            <div>
              <Label htmlFor="whyApply" className="text-xs">Why are you applying for this opportunity? *</Label>
              <Textarea id="whyApply" value={whyApply} onChange={e => setWhyApply(e.target.value)}
                placeholder={isJobType
                  ? "Describe why you're a good fit for this role..."
                  : "Describe your venture and why this opportunity is relevant..."
                }
                rows={3} className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="coverLetter" className="text-xs">Additional Notes (optional)</Label>
              <Textarea id="coverLetter" value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                placeholder="Any other information you'd like to share..." rows={3} className="mt-1"
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
                  <span className="text-muted-foreground">{docLabel}:</span>
                  <span className="ml-1 font-medium">
                    {isJobType
                      ? (resumeFile ? "✓ Uploaded" : "Not provided")
                      : pitchDeckSource === "upload" && pitchDeckFile
                        ? `✓ ${pitchDeckFile.name}`
                        : pitchDeckSource === "existing" && selectedDeck
                          ? `✓ ${selectedDeck.file_name}`
                          : "Not provided"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Extra docs:</span>
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
              <Button onClick={handleSubmit} disabled={submitting || !canSubmit} className="gap-2">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Submit Application</>
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
