import { useState, useEffect } from "react";
import { Clock, Building2, DollarSign, Landmark, Sparkles, Users2, Briefcase, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useInvestorTracking } from "@/hooks/useInvestorTracking";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = {
  building: Building2,
  landmark: Landmark,
  users: Users2,
  briefcase: Briefcase,
  globe: Globe,
  dollar: DollarSign,
};

const InvestorRightSidebar = () => {
  const { user, profile } = useAuth();
  const { recentViews, shortlisted, clearHistory, loading } = useInvestorTracking();

  // Ecosystem insights - real data
  const [ecosystemStats, setEcosystemStats] = useState({
    activeInvestors: 0,
    totalStartups: 0,
    profileCompleteness: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Count investors (users with investor role)
      const { count: investorCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "investor");

      // Count startups
      const { count: startupCount } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true });

      // Calculate profile completeness
      let completeness = 0;
      if (profile) {
        const fields = [
          profile.full_name, profile.bio, profile.headline, profile.location,
          profile.industry, profile.company_name, profile.avatar_url,
          profile.linkedin_url, profile.website_url, profile.phone,
          profile.expertise, profile.company_stage,
        ];
        const filled = fields.filter(f => f && (Array.isArray(f) ? f.length > 0 : true)).length;
        completeness = Math.round((filled / fields.length) * 100);
      }

      setEcosystemStats({
        activeInvestors: investorCount ?? 0,
        totalStartups: startupCount ?? 0,
        profileCompleteness: completeness,
      });
    };

    fetchStats();
  }, [profile]);

  const matchCount = shortlisted.length;

  return (
    <aside className="hidden w-72 shrink-0 space-y-5 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      {/* Recently Viewed */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Recently Viewed</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : recentViews.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No recently viewed investors. Browse investors to see history here.
          </p>
        ) : (
          <div className="space-y-3">
            {recentViews.map((item) => {
              const Icon = iconMap[item.investor_icon || "building"] || Building2;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{item.investor_name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.timeAgo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {recentViews.length > 0 && (
          <button
            onClick={clearHistory}
            className="mt-4 w-full text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Clear History
          </button>
        )}
      </Card>

      {/* AI Matching / Shortlist Status */}
      <Card className="p-5 bg-primary text-primary-foreground border-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold">Matching AI</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              {matchCount > 0 ? `${matchCount} Shortlisted` : "Ready to Match"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed opacity-90">
          {matchCount > 0
            ? `You've shortlisted ${matchCount} investor${matchCount !== 1 ? "s" : ""}. View and manage your shortlist in the Shortlisted tab.`
            : "Browse investors and shortlist the ones that match your startup's needs."}
        </p>
        <Button variant="secondary" size="sm" className="mt-3 w-full text-xs font-semibold">
          {matchCount > 0 ? "View Shortlisted" : "Start Matching"}
        </Button>
      </Card>

      {/* Ecosystem Insights - Real Data */}
      <Card className="p-5">
        <h3 className="text-sm font-bold">Ecosystem Insights</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Investors</span>
            <span className="text-sm font-bold text-primary">{ecosystemStats.activeInvestors}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Registered Startups</span>
            <span className="text-sm font-bold text-primary">{ecosystemStats.totalStartups}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Shortlisted</span>
            <span className="text-sm font-bold text-primary">{matchCount}</span>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={ecosystemStats.profileCompleteness} className="h-1.5" />
          <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
            Your profile completeness is {ecosystemStats.profileCompleteness}% — complete your profile to improve investor matching.
          </p>
        </div>
      </Card>
    </aside>
  );
};

export default InvestorRightSidebar;
