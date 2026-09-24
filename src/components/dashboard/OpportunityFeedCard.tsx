import { DollarSign, Briefcase, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { accentClass, type Category } from "@/lib/categoryAccents";
import type { FeedItem } from "@/hooks/useHomeFeed";

interface OpportunityFeedCardProps {
  item: FeedItem;
  onViewDetail?: (id: string) => void;
}

/**
 * These used to be hardcoded Tailwind pairs — text-emerald-600 bg-emerald-50,
 * text-blue-600 bg-blue-50 — which are light-theme values. On a dark card the
 * tile rendered a near-white block, and none of them matched the hue the rest
 * of the platform uses for the same idea.
 */
const typeConfig: Record<string, { icon: typeof DollarSign; label: string; category: Category }> = {
  grant: { icon: DollarSign, label: "Grant", category: "funding" },
  funding: { icon: DollarSign, label: "Funding", category: "funding" },
  accelerator: { icon: Briefcase, label: "Accelerator", category: "startup" },
  job: { icon: Briefcase, label: "Job", category: "opportunity" },
};

const OpportunityFeedCard = ({ item, onViewDetail }: OpportunityFeedCardProps) => {
  const config = typeConfig[item.opp_type || "grant"] || typeConfig.grant;
  const Icon = config.icon;
  const accent = accentClass(config.category);
  const deadline = item.deadline ? new Date(item.deadline) : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className={`${accent} accent-tile h-9 w-9`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`${accent} accent-text text-[11px] font-semibold uppercase tracking-[0.1em]`}>
            {config.label}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">{item.title}</h3>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{item.organization}</p>
        </div>

        {item.amount && (
          <p className="shrink-0 text-[15px] font-semibold tabular-nums">{item.amount}</p>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">{item.description}</p>

      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-[11px] font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        {deadline ? (
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            Closes {deadline.toLocaleDateString("en", { month: "short", day: "numeric" })}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground">Rolling</p>
        )}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full px-4 text-[13px] font-medium"
          onClick={() => onViewDetail?.(item.id)}
        >
          View
        </Button>
      </div>
    </div>
  );
};

export default OpportunityFeedCard;
