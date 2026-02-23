import { Clock, Building2, DollarSign, Landmark, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentlyViewed = [
  { name: "Savannah VC", time: "Viewed 2h ago", icon: Building2 },
  { name: "Blue Ocean Ang...", time: "Viewed 5h ago", icon: DollarSign },
  { name: "Golden Age Cap...", time: "Viewed yesterday", icon: Landmark },
];

const InvestorRightSidebar = () => {
  return (
    <aside className="hidden w-72 shrink-0 space-y-5 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      {/* Recently Viewed */}
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Recently Viewed</h3>
        </div>
        <div className="space-y-3">
          {recentlyViewed.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          Clear History
        </button>
      </div>

      {/* Matching AI */}
      <div className="rounded-xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold">Matching AI</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Ready for Review</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed opacity-90">
          We found 5 new investors matching your latest pitch deck update.
        </p>
        <Button variant="secondary" size="sm" className="mt-3 w-full text-xs font-semibold">
          View Recommendations
        </Button>
      </div>

      {/* Ecosystem Insights */}
      <div className="rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold">Ecosystem Insights</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Investors</span>
            <span className="text-sm font-bold text-primary">248</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Average Match %</span>
            <span className="text-sm font-bold text-primary">74.2%</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-primary to-primary/60" />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
            Your profile completeness is 85% — higher than 92% of founders in your stage.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default InvestorRightSidebar;
