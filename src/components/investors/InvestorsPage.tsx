import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import InvestorCard, { type InvestorData } from "./InvestorCard";
import InvestorFilters from "./InvestorFilters";
import InvestorDetailPage from "./InvestorDetailPage";
import OutreachHistoryTab from "./OutreachHistoryTab";
import IncomingRequestsTab from "./IncomingRequestsTab";
import { useInvestorTracking } from "@/hooks/useInvestorTracking";
import { useFollows } from "@/hooks/useFollows";
import { useNetwork } from "@/hooks/useNetwork";
import { useConnections } from "@/hooks/useConnections";

const demoInvestors: InvestorData[] = [
  { id: "1", name: "Accra Venture Partners", description: "Early-stage VC focusing on FinTech and e-commerce startups across West Africa with hands-on mentorship and strategic connections.", tags: ["FinTech", "Seed", "B2B"], avgTicket: "$150k", matchPercent: 98, status: "Active Now", icon: "building" },
  { id: "2", name: "GCF Impact Fund", description: "Driving sustainable growth through Series A investments in climate-positive ventures across Ghana and the broader region.", tags: ["CleanTech", "Series A", "Impact"], avgTicket: "$750k", matchPercent: 85, status: "Replied in 2h", icon: "globe" },
  { id: "3", name: "Pan-African Angels", description: "Strategic angel network connecting diaspora capital to high-potential African startups at the earliest stages.", tags: ["Any Sector", "Pre-Seed", "Equity"], avgTicket: "$25k", matchPercent: 92, status: "Top Rated", icon: "users" },
  { id: "4", name: "Kumasi Tech Capital", description: "Dedicated to fostering the tech ecosystem in the Ashanti region with seed-stage investments in hardware and SaaS.", tags: ["Hardware", "Seed", "SaaS"], avgTicket: "$100k", matchPercent: 72, status: "New Fund", icon: "briefcase" },
  { id: "5", name: "Osei-Danquah Family Office", description: "Private capital group looking for sustainable real estate and property technology investments across Ghana.", tags: ["PropTech", "Growth", "Debt"], avgTicket: "$500k", matchPercent: 89, status: "Verified", icon: "landmark" },
  { id: "6", name: "Retail West Africa Fund", description: "Specialized fund for retail supply chain optimization and last-mile logistics solutions across West Africa.", tags: ["Logistics", "SME", "Seed"], avgTicket: "$125k", matchPercent: 65, status: "Low Activity", icon: "dollar" },
];

// Map investor IDs to potential real user IDs from the network (investors)
function useInvestorUserMap() {
  const { profiles } = useNetwork();
  // Find profiles with investor role to map demo investors to real users
  const investorProfiles = useMemo(
    () => profiles.filter(p => p.roles.includes("investor")),
    [profiles]
  );
  return investorProfiles;
}

const InvestorsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [ticketSize, setTicketSize] = useState("all");
  const [region, setRegion] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorData | null>(null);

  const { trackView, toggleShortlist, isShortlisted, shortlisted } = useInvestorTracking();
  const { toggleFollow, isFollowing } = useFollows();
  const { pendingReceived } = useConnections();
  const investorProfiles = useInvestorUserMap();

  // Map demo investor IDs to real user IDs when possible
  const getInvestorUserId = (investorId: string): string | null => {
    const idx = parseInt(investorId) - 1;
    return investorProfiles[idx]?.user_id ?? null;
  };

  const handleConnect = (investorId: string) => {
    const realUserId = getInvestorUserId(investorId);
    if (realUserId) {
      toggleFollow(realUserId);
      const inv = demoInvestors.find(i => i.id === investorId);
      if (inv && !isFollowing(realUserId)) {
        toast({ title: "Connected!", description: `You're now connected with ${inv.name}.` });
      }
    } else {
      // For demo investors without real user mapping, track as shortlist
      const inv = demoInvestors.find(i => i.id === investorId);
      if (inv) {
        toggleShortlist(inv.id, inv.name, inv);
        toast({ title: "Shortlisted!", description: `${inv.name} added to your shortlist.` });
      }
    }
  };

  const isConnected = (investorId: string): boolean => {
    const realUserId = getInvestorUserId(investorId);
    if (realUserId) return isFollowing(realUserId);
    return isShortlisted(investorId);
  };

  const clearFilters = () => { setIndustry("all"); setTicketSize("all"); setRegion("all"); };

  const filtered = demoInvestors.filter((inv) => {
    if (searchQuery && !inv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (industry !== "all" && !inv.tags.some(t => t.toLowerCase().includes(industry))) return false;
    return true;
  });

  const handleViewInvestor = (inv: InvestorData) => {
    trackView(inv.id, inv.name, inv.icon);
    setSelectedInvestor(inv);
  };

  const shortlistedInvestors = demoInvestors.filter(inv => isShortlisted(inv.id));

  if (selectedInvestor) {
    return <InvestorDetailPage investor={selectedInvestor} onBack={() => setSelectedInvestor(null)} />;
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
          <TabsTrigger value="incoming" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-semibold">
            Incoming Requests {pendingReceived.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {pendingReceived.length}
              </span>
            )}
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

        <TabsContent value="incoming" className="mt-5">
          <IncomingRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorsPage;
