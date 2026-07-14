import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, DollarSign, TrendingUp, ExternalLink, CheckCircle2 } from "lucide-react";
import { formatInvestorType, formatCheckSize, type IndexInvestor } from "@/hooks/useIndexInvestors";
import { SECTORS } from "@/hooks/useIndexStartups";

interface IndexInvestorDetailModalProps {
  investor: IndexInvestor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IndexInvestorDetailModal({ investor, open, onOpenChange }: IndexInvestorDetailModalProps) {
  if (!investor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {investor.logo_url ? (
              <img src={investor.logo_url} alt={investor.name} className="w-14 h-14 rounded-xl object-cover border" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-lg">
                {investor.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{investor.name}</DialogTitle>
                {investor.verified && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{formatInvestorType(investor.type)}</Badge>
                {investor.hq_country && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {investor.hq_country}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {investor.description && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{investor.description}</p>
        )}

        {(investor.check_size_min || investor.check_size_max) && (
          <div className="mt-4 p-3 border rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Check Size
            </h4>
            <p className="text-lg font-semibold text-primary">
              {formatCheckSize(investor.check_size_min)} — {formatCheckSize(investor.check_size_max)}
            </p>
          </div>
        )}

        {investor.focus_sectors.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Focus Sectors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {investor.focus_sectors.map(sector => (
                <Badge key={sector} variant="secondary" className="capitalize">
                  {sector.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {investor.stage_focus.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Stage Focus
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {investor.stage_focus.map(stage => (
                <Badge key={stage} variant="outline" className="capitalize">
                  {stage.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {investor.website_url && (
          <a
            href={investor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
          >
            <Globe className="h-3.5 w-3.5" />
            {investor.website_url.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
