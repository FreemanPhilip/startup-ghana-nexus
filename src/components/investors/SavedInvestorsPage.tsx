import { Bookmark, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInvestorTracking } from "@/hooks/useInvestorTracking";
import { accentClass } from "@/lib/categoryAccents";

/**
 * The shortlist, and what you looked at recently.
 *
 * "Saved" and "Portfolio" both used to render the connections screen — two
 * nav items, one view, and neither of them showing what its label promised.
 * The shortlist data was already being fetched and had nowhere to appear.
 */
const SavedInvestorsPage = () => {
  const { shortlisted, loading, recentViews, toggleShortlist } = useInvestorTracking();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">Investors you shortlisted.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : shortlisted.length === 0 ? (
        <Card className="p-10 text-center">
          <div className={`${accentClass("investor")} accent-tile mx-auto h-10 w-10`}>
            <Bookmark className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-medium">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Shortlist an investor from Discover to keep them here.</p>
        </Card>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {shortlisted.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-4">
              <div className={`${accentClass("investor")} accent-tile h-9 w-9`}>
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{s.investor_name}</p>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
                aria-label={`Remove ${s.investor_name} from saved`}
                onClick={() => toggleShortlist({ investorId: s.investor_id, investorName: s.investor_name })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {recentViews.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Recently viewed
          </h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {recentViews.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 p-3.5">
                <p className="min-w-0 truncate text-sm font-medium">{v.investor_name}</p>
                <p className="shrink-0 text-[12px] text-muted-foreground">{v.timeAgo}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SavedInvestorsPage;
