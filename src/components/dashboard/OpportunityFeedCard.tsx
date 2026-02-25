import { Users, DollarSign, Briefcase, Calendar, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FeedItem } from "@/hooks/useHomeFeed";

interface OpportunityFeedCardProps {
  item: FeedItem;
}

const typeConfig: Record<string, { icon: typeof DollarSign; label: string; color: string }> = {
  grant: { icon: DollarSign, label: "Grant", color: "text-emerald-600 bg-emerald-50" },
  funding: { icon: DollarSign, label: "Funding", color: "text-emerald-600 bg-emerald-50" },
  accelerator: { icon: Briefcase, label: "Accelerator", color: "text-blue-600 bg-blue-50" },
  job: { icon: Briefcase, label: "Job", color: "text-purple-600 bg-purple-50" },
};

const OpportunityFeedCard = ({ item }: OpportunityFeedCardProps) => {
  const config = typeConfig[item.opp_type || "grant"] || typeConfig.grant;
  const Icon = config.icon;
  const deadline = item.deadline ? new Date(item.deadline) : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <div className={`h-5 w-5 rounded flex items-center justify-center ${config.color}`}>
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {config.label} Opportunity
        </span>
      </div>
      <div className="px-5 pb-4 space-y-2">
        <h3 className="text-sm font-bold">{item.title}</h3>
        <p className="text-xs text-muted-foreground">{item.organization}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {item.amount && (
            <span className="text-xs font-semibold text-emerald-600">{item.amount}</span>
          )}
          {deadline && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Deadline: {deadline.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        )}
        <Button size="sm" className="gap-1.5 text-xs mt-1">
          <ExternalLink className="h-3 w-3" /> View Details
        </Button>
      </div>
    </div>
  );
};

export default OpportunityFeedCard;
