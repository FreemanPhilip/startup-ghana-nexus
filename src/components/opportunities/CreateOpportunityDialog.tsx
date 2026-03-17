import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateOpportunityDialogProps {
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

const opportunityTypes = [
  { value: "grant", label: "Grant" },
  { value: "funding_call", label: "Funding Call" },
  { value: "accelerator", label: "Accelerator" },
  { value: "job", label: "Job" },
];

const CreateOpportunityDialog = ({ onCreated, trigger }: CreateOpportunityDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("grant");
  const [organization, setOrganization] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const reset = () => {
    setTitle(""); setDescription(""); setType("grant"); setOrganization("");
    setAmount(""); setDeadline(""); setLocation(""); setEligibility(""); setTagsInput("");
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!title.trim() || !description.trim() || !organization.trim()) {
      toast.error("Title, description, and organization are required");
      return;
    }
    setSubmitting(true);
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("opportunities").insert({
      title: title.trim(),
      description: description.trim(),
      type,
      organization: organization.trim(),
      amount: amount.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      location: location.trim() || null,
      eligibility: eligibility.trim() || null,
      tags: tags.length > 0 ? tags : null,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to create opportunity: " + error.message); return; }
    toast.success("Opportunity posted!");
    reset();
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-gold text-navy font-semibold hover:opacity-90 gap-2">
            <Plus className="h-4 w-4" /> Post Opportunity
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Post an Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Startup Growth Grant 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {opportunityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Organization *</Label>
              <Input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="e.g. World Bank" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the opportunity..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. GH₵500,000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Eligibility</Label>
              <Input value={eligibility} onChange={e => setEligibility(e.target.value)} placeholder="e.g. Early-stage startups" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. fintech, AI, agriculture" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-gold text-navy font-semibold hover:opacity-90 gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Posting..." : "Post Opportunity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOpportunityDialog;
