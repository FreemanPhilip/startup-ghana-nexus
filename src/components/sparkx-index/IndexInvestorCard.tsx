import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, CheckCircle2 } from "lucide-react";
import { formatInvestorType, formatCheckSize, type IndexInvestor } from "@/hooks/useIndexInvestors";

interface IndexInvestorCardProps {
  investor: IndexInvestor;
  onClick: () => void;
}

export function IndexInvestorCard({ investor, onClick }: IndexInvestorCardProps) {
  const initials = investor.name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {investor.logo_url ? (
            <img src={investor.logo_url} alt={investor.name} className="w-12 h-12 rounded-lg object-cover border" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {investor.name}
              </h3>
              {investor.verified && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {formatInvestorType(investor.type)}
              </Badge>
              {investor.hq_country && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {investor.hq_country}
                </span>
              )}
            </div>
          </div>
          {(investor.check_size_min || investor.check_size_max) && (
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-primary flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatCheckSize(investor.check_size_min)} - {formatCheckSize(investor.check_size_max)}
              </div>
              <div className="text-[10px] text-muted-foreground">Check size</div>
            </div>
          )}
        </div>
        {investor.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{investor.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {investor.focus_sectors.slice(0, 4).map(sector => (
            <Badge key={sector} variant="outline" className="text-xs capitalize">
              {sector.replace(/_/g, " ")}
            </Badge>
          ))}
          {investor.focus_sectors.length > 4 && (
            <Badge variant="outline" className="text-xs">+{investor.focus_sectors.length - 4}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
