import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InvestorCard, { type InvestorData } from "./InvestorCard";
import InvestorFilters from "./InvestorFilters";
import InvestorDetailPage from "./InvestorDetailPage";
import OutreachHistoryTab from "./OutreachHistoryTab";
import { useInvestorTracking } from "@/hooks/useInvestorTracking";
import { useFollows } from "@/hooks/useFollows";

const demoInvestors: InvestorData[] = [
  { id: "demo-1", name: "Accra Venture Partners", description: "Early-stage VC focusing on FinTech and e-commerce startups across West Africa with hands-on mentorship and strategic connections.", tags: ["FinTech", "Seed", "B2B"], avgTicket: "GH₵1.5M", matchPercent: 98, status: "Active Now", icon: "building" },
  { id: "demo-2", name: "GCF Impact Fund", description: "Driving sustainable growth through Series A investments in climate-positive ventures across Ghana and the broader region.", tags: ["CleanTech", "Series A", "Impact"], avgTicket: "GH₵7.5M", matchPercent: 85, status: "Replied in 2h", icon: "globe" },
  { id: "demo-3", name: "Pan-African Angels", description: "Strategic angel network connecting diaspora capital to high-potential African startups at the earliest stages.", tags: ["Any Sector", "Pre-Seed", "Equity"], avgTicket: "GH₵250k", matchPercent: 92, status: "Top Rated", icon: "users" },
  { id: "demo-4", name: "Kumasi Tech Capital", description: "Dedicated to fostering the tech ecosystem in the Ashanti region with seed-stage investments in hardware and SaaS.", tags: ["Hardware", "Seed", "SaaS"], avgTicket: "GH₵1M", matchPercent: 72, status: "New Fund", icon: "briefcase" },
  { id: "demo-5", name: "Osei-Danquah Family Office", description: "Private capital group looking for sustainable real estate and property technology investments across Ghana.", tags: ["PropTech", "Growth", "Debt"], avgTicket: "GH₵5M", matchPercent: 89, status: "Verified", icon: "landmark" },
  { id: "demo-6", name: "Retail West Africa Fund", description: "Specialized fund for retail supply chain optimization and last-mile logistics solutions across West Africa.", tags: ["Logistics", "SME", "Seed"], avgTicket: "GH₵1.25M", matchPercent: 65, status: "Low Activity", icon: "dollar" },
];

interface InvestorsPageProps {
  onViewStartup?: (startupId: string) => void;
}

const InvestorsPage = ({ onViewStartup }: InvestorsPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [ticketSize, setTicketSize] = useState("all");
  const [region, setRegion] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorData | null>(null);

  const { trackView, toggleShortlist, isShortlisted } = useInvestorTracking();
  const { toggleFollow, isFollowing } = useFollows();

  // Fetch real investors from DB
  const { data: realInvestors = [], isLoading } = useQuery({
    queryKey: ["investors-real"],
    queryFn: async () => {
      const { data: investorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "investor");

      const investorIds = investorRoles?.map((r) => r.user_id) ?? [];
      if (investorIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", investorIds);

      return (profiles ?? []).map((p): InvestorData => ({
        id: p.user_id,
        name: p.company_name || p.full_name || "Investor",
        description: p.bio || p.headline || "Investor on SparkX Index",
        tags: [
          p.investment_focus || p.industry || "General",
          p.investment_range || "Flexible",
          ...(p.expertise?.slice(0, 1) || []),
        ].filter(Boolean),
        avgTicket: p.investment_range || "Flexible",
        matchPercent: Math.floor(Math.random() * 30) + 70,
        status: p.verification === "verified" ? "Verified" : "Active",
        icon: "building",
        avatar_url: p.avatar_url,
        isRealUser: true,
      }));
    },
  });

  const allInvestors = realInvestors.length > 0 ? realInvestors : demoInvestors;

  const handleConnect = (investorId: string) => {
    const inv = allInvestors.find(i => i.id === investorId);
    if (!inv) return;

    if (inv.isRealUser) {
      toggleFollow(investorId);
      if (!isFollowing(investorId)) {
        toast({ title: "Connected!", description: `You're now connected with ${inv.name}.` });
      }
    } else {
      toggleShortlist(inv.id, inv.name, inv);
      toast({ title: "Shortlisted!", description: `${inv.name} added to your shortlist.` });
    }
  };

  const isConnected = (investorId: string): boolean => {
    const inv = allInvestors.find(i => i.id === investorId);
    if (inv?.isRealUser) return isFollowing(investorId);
    return isShortlisted(investorId);
  };

  const clearFilters = () => { setIndustry("all"); setTicketSize("all"); setRegion("all"); };

  const filtered = allInvestors.filter((inv) => {
    if (searchQuery && !inv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (industry !== "all" && !inv.tags.some(t => t.toLowerCase().includes(industry))) return false;
    return true;
  });

  const handleViewInvestor = (inv: InvestorData) => {
    trackView(inv.id, inv.name, inv.icon);
    setSelectedInvestor(inv);
  };

  const shortlistedInvestors = allInvestors.filter(inv => isShortlisted(inv.id));

  if (selectedInvestor) {
    return <InvestorDetailPage investor={selectedInvestor} onBack={() => setSelectedInvestor(null)} onViewStartup={onViewStartup} />;
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Find the perfect investor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-card border-border text-sm"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matching">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-6">
          <TabsTrigger value="matching" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-semibold">
            Investor Matching Engine
          </TabsTrigger>
          <TabsTrigger value="shortlisted" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-semibold">
            Shortlisted ({shortlistedInvestors.length})
          </TabsTrigger>
          <TabsTrigger value="outreach" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-semibold">
            Outreach History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matching" className="mt-5 space-y-5">
          <InvestorFilters
            industry={industry}
            ticketSize={ticketSize}
            region={region}
            onIndustryChange={setIndustry}
            onTicketSizeChange={setTicketSize}
            onRegionChange={setRegion}
            onClear={clearFilters}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <button
                    className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleShortlist(inv.id, inv.name, inv);
                    }}
                    title={isShortlisted(inv.id) ? "Remove from shortlist" : "Add to shortlist"}
                  >
                    {isShortlisted(inv.id) ? (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <InvestorCard
                    investor={inv}
                    onView={() => handleViewInvestor(inv)}
                    onConnect={() => handleConnect(inv.id)}
                    isConnected={isConnected(inv.id)}
                  />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-sm text-muted-foreground">No investors match your current filters.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shortlisted" className="mt-5">
          {shortlistedInvestors.length === 0 ? (
            <Card className="p-8 text-center">
              <Star className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display text-lg font-bold">No Shortlisted Investors</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Click the ⭐ icon on any investor card to add them to your shortlist.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shortlistedInvestors.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <button
                    className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleShortlist(inv.id, inv.name, inv);
                    }}
                    title="Remove from shortlist"
                  >
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </button>
                  <InvestorCard
                    investor={inv}
                    onView={() => handleViewInvestor(inv)}
                    onConnect={() => handleConnect(inv.id)}
                    isConnected={isConnected(inv.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outreach" className="mt-5">
          <OutreachHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorsPage;
