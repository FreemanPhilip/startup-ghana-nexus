import { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MatchResult {
  id: string;
  name: string;
  reason: string;
  avatar_url?: string;
  headline?: string;
  expertise?: string[];
}

interface AIMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMentor?: (mentorId: string) => void;
}

const quickPrompts = [
  "I need help with fundraising and pitching to investors",
  "I'm struggling with product-market fit and user acquisition",
  "I need guidance on regulatory compliance in fintech",
  "Help me build a go-to-market strategy for my B2B SaaS",
];

const AIMatchDialog = ({ open, onOpenChange, onSelectMentor }: AIMatchDialogProps) => {
  const [challenge, setChallenge] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [advice, setAdvice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleMatch = async (text?: string) => {
    const input = text || challenge;
    if (!input.trim()) return;
    setChallenge(input);
    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke("mentor-match", {
        body: { challenge: input },
      });

      if (error) throw error;

      setMatches(data?.matches || []);
      setAdvice(data?.advice || "");
    } catch (err: any) {
      console.error("AI match error:", err);
      if (err?.message?.includes("429") || err?.status === 429) {
        toast.error("Rate limited. Please wait a moment and try again.");
      } else if (err?.message?.includes("402") || err?.status === 402) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to get AI matches. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setChallenge("");
    setMatches([]);
    setAdvice("");
    setHasSearched(false);
  };

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "M";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Mentor Matching
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5 pb-5">
          {!hasSearched ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Describe your startup's current challenge and our AI will match you with the best mentors.
              </p>

              <Textarea
                placeholder="e.g., I'm building a fintech app and need help with regulatory compliance and fundraising strategy..."
                value={challenge}
                onChange={e => setChallenge(e.target.value)}
                className="min-h-[100px] text-sm"
              />

              <Button
                className="w-full font-semibold gap-2"
                onClick={() => handleMatch()}
                disabled={!challenge.trim() || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Find My Mentors
              </Button>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Prompts
                </p>
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    className="w-full text-left rounded-lg border border-border p-2.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    onClick={() => handleMatch(prompt)}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your challenge and finding the best mentors...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User's challenge */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Your Challenge</p>
                <p className="text-xs text-foreground">{challenge}</p>
              </div>

              {/* AI advice */}
              {advice && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">AI Advice</p>
                  <p className="text-xs text-foreground">{advice}</p>
                </div>
              )}

              {/* Matches */}
              {matches.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Recommended Mentors ({matches.length})
                  </p>
                  {matches.map((match, i) => (
                    <div
                      key={match.id || i}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        onSelectMentor?.(match.id);
                        onOpenChange(false);
                        handleReset();
                      }}
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={match.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(match.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{match.name}</p>
                          <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-600 border-0 shrink-0">
                            #{i + 1} Match
                          </Badge>
                        </div>
                        {match.headline && (
                          <p className="text-[10px] text-muted-foreground truncate">{match.headline}</p>
                        )}
                        <p className="text-xs text-foreground mt-1 leading-relaxed">{match.reason}</p>
                        {match.expertise && match.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {match.expertise.slice(0, 3).map(e => (
                              <Badge key={e} variant="outline" className="text-[9px] h-4 px-1.5">{e}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No matching mentors found. Try a different description.</p>
                </div>
              )}

              <Button variant="outline" className="w-full text-xs" onClick={handleReset}>
                Try Another Challenge
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AIMatchDialog;
