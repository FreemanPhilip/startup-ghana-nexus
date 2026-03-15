import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Upload, Users, ArrowRight, ArrowLeft, Plus, X, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateStartupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const industries = ["Technology", "FinTech", "AgriTech", "HealthTech", "EdTech", "E-Commerce", "Logistics", "Energy", "Media", "Other"];
const stages = ["Idea", "MVP", "Pre-Seed", "Seed", "Series A", "Series B+", "Growth"];

const CreateStartupWizard = ({ open, onOpenChange, onCreated }: CreateStartupWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Step 3
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocName(file.name);
  };

  const addInvite = () => {
    if (!inviteEmail.trim()) return;
    setInvites(prev => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteEmail("");
    setInviteRole("employee");
  };

  const removeInvite = (index: number) => {
    setInvites(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      let logoUrl: string | undefined;
      let docUrl: string | undefined;

      // Upload logo
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `logos/${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("startup-assets").upload(path, logoFile);
        if (!error) {
          const { data } = supabase.storage.from("startup-assets").getPublicUrl(path);
          logoUrl = data.publicUrl;
        }
      }

      // Upload doc
      if (docFile) {
        const ext = docFile.name.split(".").pop();
        const path = `docs/${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("startup-assets").upload(path, docFile);
        if (!error) {
          const { data } = supabase.storage.from("startup-assets").getPublicUrl(path);
          docUrl = data.publicUrl;
        }
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const { data: startup, error } = await supabase
        .from("startups")
        .insert({
          name: name.trim(),
          slug,
          logo_url: logoUrl ?? null,
          industry: industry || null,
          stage: stage || null,
          location: location || null,
          short_description: description || null,
          website_url: websiteUrl || null,
          linkedin_url: linkedinUrl || null,
          registration_doc_url: docUrl ?? null,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Send invitations
      if (startup && invites.length > 0) {
        await supabase.from("startup_invitations").insert(
          invites.map(inv => ({
            startup_id: startup.id,
            email: inv.email,
            role: inv.role,
            invited_by: user.id,
          })) as any
        );
      }

      toast.success("Startup page created! Status: Pending Verification");
      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to create startup");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setLogoFile(null);
    setLogoPreview(null);
    setIndustry("");
    setStage("");
    setLocation("");
    setDescription("");
    setDocFile(null);
    setDocName("");
    setLinkedinUrl("");
    setWebsiteUrl("");
    setInvites([]);
    setInviteEmail("");
  };

  const canProceed1 = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create Startup Page
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              <span className="text-xs font-medium hidden sm:inline">
                {s === 1 ? "Basic Info" : s === 2 ? "Verification" : "Team"}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={handleDocSelect} />

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button onClick={() => logoInputRef.current?.click()} className="shrink-0">
                <Avatar className="h-16 w-16 border-2 border-dashed border-border hover:border-primary transition-colors">
                  <AvatarImage src={logoPreview || undefined} />
                  <AvatarFallback className="bg-muted"><Upload className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1">
                <Label className="text-xs">Startup Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechStart Africa" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Accra, Ghana" />
            </div>
            <div>
              <Label className="text-xs">Short Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does your startup do?" rows={3} className="resize-none" />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceed1} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Verification */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Registration Document</Label>
              <Button variant="outline" onClick={() => docInputRef.current?.click()} className="w-full justify-start gap-2 mt-1">
                <Upload className="h-4 w-4" />
                {docName || "Upload document (PDF, DOC, Image)"}
              </Button>
            </div>
            <div>
              <Label className="text-xs">LinkedIn Company Page</Label>
              <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/..." />
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourcompany.com" />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Invite Team */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Invite team members to your startup page.</p>
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="team@email.com"
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && addInvite()}
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={addInvite}><Plus className="h-4 w-4" /></Button>
            </div>
            {invites.length > 0 && (
              <div className="space-y-2">
                {invites.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{inv.role}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeInvite(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-gradient-gold text-navy font-semibold hover:opacity-90">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                {submitting ? "Creating..." : "Create Startup"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStartupWizard;
