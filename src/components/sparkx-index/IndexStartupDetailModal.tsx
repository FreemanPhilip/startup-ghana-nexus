import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, Globe, Calendar, TrendingUp, ExternalLink, CheckCircle2 } from "lucide-react";
import { formatStage, formatSector, type IndexStartup, type FundingRound } from "@/hooks/useIndexStartups";

interface IndexStartupDetailModalProps {
  startup: IndexStartup | null;
  rounds: FundingRound[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IndexStartupDetailModal({ startup, rounds, open, onOpenChange }: IndexStartupDetailModalProps) {
  if (!startup) return null;

  const totalRaised = rounds.reduce((sum, r) => sum + (r.amount_usd ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {startup.logo_url ? (
              <img src={startup.logo_url} alt={startup.name} className="w-16 h-16 rounded-xl object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {startup.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{startup.name}</DialogTitle>
                {startup.verified && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                {(startup.city || startup.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[startup.city, startup.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {startup.founded_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {startup.founded_year}
                  </span>
                )}
                {startup.team_size && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {startup.team_size} people
                  </span>
                )}
              </div>
            </div>
            {startup.sparkx_score != null && (
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-primary">{startup.sparkx_score}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">SparkX Score</div>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-2">
          {startup.sector && <Badge variant="secondary">{formatSector(startup.sector)}</Badge>}
          {startup.stage && <Badge variant="outline">{formatStage(startup.stage)}</Badge>}
          {startup.is_raising && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Currently Raising</Badge>
          )}
        </div>

        {startup.description && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{startup.description}</p>
        )}

        {startup.website_url && (
          <a
            href={startup.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
          >
            <Globe className="h-3.5 w-3.5" />
            {startup.website_url.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {rounds.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Funding History
                {totalRaised > 0 && (
                  <span className="text-muted-foreground font-normal">
                    — Total raised: ${totalRaised >= 1_000_000 ? `${(totalRaised / 1_000_000).toFixed(1)}M` : `${(totalRaised / 1_000).toFixed(0)}K`}
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                {rounds.map(round => (
                  <div key={round.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="text-xs mb-1">
                          {formatStage(round.round_type)}
                        </Badge>
                        {round.announced_on && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(round.announced_on).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                          </p>
                        )}
                      </div>
                      {round.amount_usd != null && (
                        <div className="text-right font-semibold">
                          ${round.amount_usd >= 1_000_000
                            ? `${(round.amount_usd / 1_000_000).toFixed(1)}M`
                            : `${(round.amount_usd / 1_000).toFixed(0)}K`}
                        </div>
                      )}
                    </div>
                    {round.investors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {round.investors.map((inv, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px]">
                            {inv.name}
                            {inv.is_lead && " (Lead)"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
