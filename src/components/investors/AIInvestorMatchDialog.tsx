import { useState } from "react";
import { Sparkles, Loader2, Star, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInvestorTracking } from "@/hooks/useInvestorTracking";

interface InvestorMatch {
  investor_id: string;
  investor_name: string;
  match_percent: number;
  reasoning: string;
  strengths: string[];
}

interface AIInvestorMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewInvestor?: (investorId: string) => void;
}

const getMatchColor = (pct: number) => {
  if (pct >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 75) return "text-primary";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
};

const getMatchBg = (pct: number) => {
  if (pct >= 90) return "bg-emerald-500/10 border-emerald-500/20";
  if (pct >= 75) return "bg-primary/10 border-primary/20";
  if (pct >= 60) return "bg-amber-500/10 border-amber-500/20";
  return "bg-muted border-border";
};

const AIInvestorMatchDialog = ({ open, onOpenChange, onViewInvestor }: AIInvestorMatchDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<InvestorMatch[]>([]);
  const [userContext, setUserContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const { toggleShortlist, isShortlisted } = useInvestorTracking();

  const runMatching = async () => {
    setLoading(true);
    setError(null);
    setMatches([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("investor-match", {
        body: {},
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setMatches(data.matches || []);
      setUserContext(data.userContext || null);
      setHasRun(true);
    } catch (e: any) {
      console.error("AI matching error:", e);
      setError(e.message || "Failed to run AI matching");
      toast({
        title: "Matching Failed",
        description: e.message || "Could not run AI matching. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Investor Matching
          </DialogTitle>
        </DialogHeader>

        {!hasRun && !loading && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold">Find Your Perfect Investors</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Our AI analyzes your startup profile, industry, stage, and funding needs to rank
                investors by compatibility and provide specific reasoning for each match.
              </p>
            </div>
            <Button onClick={runMatching} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Run AI Matching
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your profile & matching investors...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={runMatching}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {hasRun && matches.length > 0 && (
          <div className="space-y-4">
            {/* Context summary */}
            {userContext && (
              <div className="rounded-lg bg-muted/50 border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Matching for <span className="font-semibold text-foreground">{userContext.name}</span>
                  {userContext.startupCount > 0 && (
                    <> · {userContext.startupCount} startup{userContext.startupCount !== 1 ? "s" : ""}</>
                  )}
                  {userContext.industry && userContext.industry !== "Not specified" && (
                    <> · {userContext.industry}</>
                  )}
                  {userContext.stage && userContext.stage !== "Not specified" && (
                    <> · {userContext.stage}</>
                  )}
                </p>
              </div>
            )}

            {/* Match results */}
            <div className="space-y-3">
              {matches.map((match, i) => (
                <Card key={match.investor_id} className={`p-4 border ${i === 0 ? getMatchBg(match.match_percent) : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <h4 className="text-sm font-bold truncate">{match.investor_name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {match.reasoning}
                      </p>
                      {match.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {match.strengths.map((s, si) => (
                            <Badge key={si} variant="outline" className="text-[10px] gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-bold ${getMatchColor(match.match_percent)}`}>
                        {match.match_percent}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">match</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Progress value={match.match_percent} className="h-1.5 flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 px-2"
                      onClick={() => {
                        toggleShortlist(match.investor_id, match.investor_name);
                      }}
                    >
                      <Star className={`h-3 w-3 ${isShortlisted(match.investor_id) ? "fill-amber-400 text-amber-400" : ""}`} />
                      {isShortlisted(match.investor_id) ? "Shortlisted" : "Shortlist"}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] px-3"
                      onClick={() => {
                        onOpenChange(false);
                        onViewInvestor?.(match.investor_id);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Re-run */}
            <div className="text-center pt-2">
              <Button size="sm" variant="ghost" onClick={runMatching} className="text-xs gap-1">
                <TrendingUp className="h-3 w-3" />
                Re-run Matching
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIInvestorMatchDialog;
