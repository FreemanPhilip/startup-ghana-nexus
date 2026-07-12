import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStartups } from "@/hooks/useStartups";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  indexStartupId: string;
  indexStartupName: string;
  onSubmitted?: () => void;
}

const ClaimStartupDialog = ({ open, onOpenChange, indexStartupId, indexStartupName, onSubmitted }: Props) => {
  const { user } = useAuth();
  const { myStartups } = useStartups();
  const [memberStartupId, setMemberStartupId] = useState<string>("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);

  const eligibleStartups = myStartups.filter((s) => ["owner", "admin"].includes(s.my_role));

  const submit = async () => {
    if (!user) { toast.error("Please sign in first."); return; }
    if (!memberStartupId) { toast.error("Select the startup profile making this claim."); return; }
    if (!evidence.trim() || evidence.length < 20) { toast.error("Add evidence (min 20 chars): email domain, LinkedIn, role."); return; }
    setBusy(true);
    const { error } = await (supabase as any).from("index_claims").insert({
      index_startup_id: indexStartupId,
      member_startup_id: memberStartupId,
      claimant_id: user.id,
      evidence: evidence.trim(),
      status: "pending",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Claim submitted. Our team will review it shortly.");
    setEvidence("");
    setMemberStartupId("");
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim {indexStartupName}</DialogTitle>
          <DialogDescription>
            Prove that you represent this startup. Our team reviews every claim before verification.
          </DialogDescription>
        </DialogHeader>

        {eligibleStartups.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            You need to create your own startup profile before claiming an index entry.{" "}
            <a href="/founder/dashboard" className="text-primary underline">Create one here.</a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Claim on behalf of</Label>
              <Select value={memberStartupId} onValueChange={setMemberStartupId}>
                <SelectTrigger><SelectValue placeholder="Pick your startup profile" /></SelectTrigger>
                <SelectContent>
                  {eligibleStartups.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Evidence</Label>
              <Textarea
                rows={5}
                placeholder="Work email at this company's domain, LinkedIn URL, your role, or a founder contact who can confirm."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy || eligibleStartups.length === 0}>
            {busy ? "Submitting…" : "Submit claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimStartupDialog;
