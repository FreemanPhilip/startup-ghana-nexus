import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";

interface RequestIntroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorName: string;
  onSend: (message: string, startup?: string) => Promise<boolean>;
  startups?: { id: string; name: string }[];
}

const introTemplates = [
  "I'd love to connect and share how my startup aligns with your investment thesis.",
  "I'm building in a space you actively invest in and would welcome the opportunity to discuss potential synergies.",
  "Our traction metrics match your investment criteria. I'd appreciate a brief intro call to explore fit.",
];

const RequestIntroDialog = ({ open, onOpenChange, investorName, onSend, startups }: RequestIntroDialogProps) => {
  const [message, setMessage] = useState("");
  const [selectedStartup, setSelectedStartup] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    const ok = await onSend(message, selectedStartup || undefined);
    setSending(false);
    if (ok) {
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setMessage("");
        setSelectedStartup("");
      }, 1500);
    }
  };

  const applyTemplate = (t: string) => setMessage(t);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Request Intro — {investorName}
          </DialogTitle>
          <DialogDescription>
            Send a personalized introduction request. A strong message increases your chance of a response.
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
              Send Intro Request
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestIntroDialog;
