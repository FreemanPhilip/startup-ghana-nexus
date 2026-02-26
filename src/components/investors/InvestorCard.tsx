import { Building2, DollarSign, Landmark, Users2, Briefcase, Globe, UserPlus, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  building: Building2,
  landmark: Landmark,
  users: Users2,
  briefcase: Briefcase,
  globe: Globe,
  dollar: DollarSign,
};

export interface InvestorData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  avgTicket: string;
  matchPercent: number;
  status: string;
  icon: string;
}

interface InvestorCardProps {
  investor: InvestorData;
  onConnect?: (id: string) => void;
  onView?: () => void;
  isConnected?: boolean;
}

const getMatchColor = (pct: number) => {
  if (pct >= 90) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (pct >= 80) return "bg-primary/10 text-primary border-primary/20";
  if (pct >= 70) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-muted text-muted-foreground border-border";
};

const InvestorCard = ({ investor, onConnect, onView, isConnected }: InvestorCardProps) => {
  const Icon = iconMap[investor.icon] || Building2;

  return (
    <div
      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => onView?.()}
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${getMatchColor(investor.matchPercent)}`}>
              {investor.matchPercent}% Match
            </span>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{investor.status}</p>
          </div>
        </div>

        <h3 className="mt-4 text-base font-bold leading-tight">{investor.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {investor.description}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {investor.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] font-medium px-2 py-0.5">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AVG TICKET</p>
          <p className="text-sm font-bold text-primary">{investor.avgTicket}</p>
        </div>
        <Button
          size="sm"
          variant={isConnected ? "outline" : "default"}
          className="font-semibold text-xs px-4 gap-1.5"
          onClick={(e) => { e.stopPropagation(); onConnect?.(investor.id); }}
        >
          {isConnected ? (
            <>
              <UserCheck className="h-3.5 w-3.5" />
              Connected
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              Connect
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InvestorCard;
