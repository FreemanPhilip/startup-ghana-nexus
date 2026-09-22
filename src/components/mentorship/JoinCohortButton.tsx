import { useState } from "react";
import { UserPlus, Clock, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMentorshipWith } from "@/hooks/useMentorship";

interface JoinCohortButtonProps {
  mentorId: string;
  mentorName?: string | null;
  size?: "sm" | "default";
  className?: string;
}

/**
 * Lets a mentee ask to join a mentor's cohort, and reflects where that request
 * currently stands. Booking a session also adds you to the cohort, so this is
 * the path for mentees who want ongoing mentorship rather than a single call.
 */
const JoinCohortButton = ({ mentorId, mentorName, size = "sm", className }: JoinCohortButtonProps) => {
  const { status, canRequest, loading, join, joining, leave } = useMentorshipWith(mentorId);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  // Own profile, or signed out — nothing to offer.
  if (!canRequest) return null;

  if (loading) {
    return (
      <Button size={size} variant="outline" className={className} disabled>
        <Clock className="h-3.5 w-3.5" /> Checking…
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button size={size} variant="outline" className={`gap-1.5 text-xs ${className ?? ""}`} disabled>
        <Clock className="h-3.5 w-3.5" /> Request pending
      </Button>
    );
  }

  if (status === "active") {
    return (
      <Button
        size={size}
        variant="outline"
        className={`gap-1.5 text-xs ${className ?? ""}`}
        onClick={() => void leave()}
        title="Leave this cohort"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        In cohort
        <LogOut className="h-3 w-3 opacity-60" />
      </Button>
    );
  }

  const submit = async () => {
    await join(note.trim() || undefined);
    setOpen(false);
    setNote("");
  };

  return (
    <>
      <Button
        size={size}
        variant="outline"
        className={`gap-1.5 text-xs ${className ?? ""}`}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-3.5 w-3.5" />
        {status === "declined" || status === "ended" ? "Request again" : "Join cohort"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request mentorship</DialogTitle>
            <DialogDescription>
              Ask {mentorName || "this mentor"} to take you on as a mentee. They'll see your
              profile alongside your note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cohort-note">What would you like help with? (optional)</Label>
            <Textarea
              id="cohort-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A sentence or two about where you are and what you're working on."
              className="min-h-[96px] text-sm"
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={joining}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={joining}>
              {joining ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinCohortButton;
