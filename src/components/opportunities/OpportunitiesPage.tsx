import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Layers, DollarSign, Rocket, Award, Briefcase, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OpportunityCard, { type OpportunityData } from "./OpportunityCard";
import OpportunityDetailPage from "./OpportunityDetailPage";
import CreateOpportunityDialog from "./CreateOpportunityDialog";
const typeFilters = [
  { id: "all", label: "All", icon: Layers },
  { id: "grant", label: "Grants", icon: Award },
  { id: "funding_call", label: "Funding Calls", icon: DollarSign },
  { id: "accelerator", label: "Accelerators", icon: Rocket },
  { id: "job", label: "Jobs", icon: Briefcase },
];

interface OpportunitiesPageProps {
  initialOpportunityId?: string | null;
  onDeepLinkConsumed?: () => void;
}

const OpportunitiesPage = ({ initialOpportunityId, onDeepLinkConsumed }: OpportunitiesPageProps) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(initialOpportunityId ?? null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("deadline", { ascending: true });

    if (user) {
      const { data: apps } = await supabase
        .from("opportunity_applications")
        .select("opportunity_id")
        .eq("user_id", user.id);
      setAppliedIds(new Set(apps?.map(a => a.opportunity_id) ?? []));
    }

    setOpportunities((data as OpportunityData[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle deep-link from other pages (e.g. home feed)
  useEffect(() => {
    if (initialOpportunityId) {
      setSelectedOpportunityId(initialOpportunityId);
      onDeepLinkConsumed?.();
    }
  }, [initialOpportunityId, onDeepLinkConsumed]);

  const handleViewDetail = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
  };

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      const matchesSearch = !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.organization.toLowerCase().includes(search.toLowerCase()) ||
        o.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "all" || o.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [opportunities, search, typeFilter]);

  const myApplications = opportunities.filter(o => appliedIds.has(o.id));

  // If viewing a detail page
  if (selectedOpportunityId) {
    return (
      <OpportunityDetailPage
        opportunityId={selectedOpportunityId}
        onBack={() => { setSelectedOpportunityId(null); fetchData(); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with search and create button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search grants, accelerators, funding calls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border text-sm"
          />
        </div>
        {user && <CreateOpportunityDialog onCreated={fetchData} />}
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-6">
          <TabsTrigger value="browse" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-semibold">
            Browse Opportunities
          </TabsTrigger>
          <TabsTrigger value="applied" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-semibold">
            My Applications ({myApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-5 space-y-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1" style={{ scrollbarWidth: "none" }}>
            {typeFilters.map((f) => {
              const Icon = f.icon;
              const isActive = typeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <OpportunityCard
                    opportunity={{ ...o, has_applied: appliedIds.has(o.id) }}
                    onApply={handleViewDetail}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">No opportunities match your search.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="mt-5">
          {myApplications.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {myApplications.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <OpportunityCard opportunity={{ ...o, has_applied: true }} onApply={handleViewDetail} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-display text-lg font-bold">No Applications Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Browse opportunities and apply to track them here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpportunitiesPage;
