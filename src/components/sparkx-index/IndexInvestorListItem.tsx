import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, CheckCircle2 } from "lucide-react";
import { formatInvestorType, formatCheckSize, type IndexInvestor } from "@/hooks/useIndexInvestors";

interface IndexInvestorListItemProps {
  investor: IndexInvestor;
  onClick: () => void;
}

export function IndexInvestorListItem({ investor, onClick }: IndexInvestorListItemProps) {
  const initials = investor.name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
      onClick={onClick}
    >
      {investor.logo_url ? (
        <img src={investor.logo_url} alt={investor.name} className="w-10 h-10 rounded-lg object-cover border shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {investor.name}
          </h3>
          {investor.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-[10px]">
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
      <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
        {investor.focus_sectors.slice(0, 3).map(sector => (
          <Badge key={sector} variant="outline" className="text-[10px] capitalize">
            {sector.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
      {(investor.check_size_min || investor.check_size_max) && (
        <div className="text-right shrink-0 hidden md:block">
          <div className="text-sm font-semibold text-primary flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {formatCheckSize(investor.check_size_min)} - {formatCheckSize(investor.check_size_max)}
          </div>
        </div>
      )}
    </div>
  );
}
