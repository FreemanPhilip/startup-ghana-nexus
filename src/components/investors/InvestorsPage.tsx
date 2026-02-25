import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InvestorCard, { type InvestorData } from "./InvestorCard";
import InvestorFilters from "./InvestorFilters";
import InvestorDetailPage from "./InvestorDetailPage";

const demoInvestors: InvestorData[] = [
  { id: "1", name: "Accra Venture Partners", description: "Early-stage VC focusing on FinTech and e-commerce startups across West Africa with hands-on mentorship and strategic connections.", tags: ["FinTech", "Seed", "B2B"], avgTicket: "$150k", matchPercent: 98, status: "Active Now", icon: "building" },
  { id: "2", name: "GCF Impact Fund", description: "Driving sustainable growth through Series A investments in climate-positive ventures across Ghana and the broader region.", tags: ["CleanTech", "Series A", "Impact"], avgTicket: "$750k", matchPercent: 85, status: "Replied in 2h", icon: "globe" },
  { id: "3", name: "Pan-African Angels", description: "Strategic angel network connecting diaspora capital to high-potential African startups at the earliest stages.", tags: ["Any Sector", "Pre-Seed", "Equity"], avgTicket: "$25k", matchPercent: 92, status: "Top Rated", icon: "users" },
  { id: "4", name: "Kumasi Tech Capital", description: "Dedicated to fostering the tech ecosystem in the Ashanti region with seed-stage investments in hardware and SaaS.", tags: ["Hardware", "Seed", "SaaS"], avgTicket: "$100k", matchPercent: 72, status: "New Fund", icon: "briefcase" },
  { id: "5", name: "Osei-Danquah Family Office", description: "Private capital group looking for sustainable real estate and property technology investments across Ghana.", tags: ["PropTech", "Growth", "Debt"], avgTicket: "$500k", matchPercent: 89, status: "Verified", icon: "landmark" },
  { id: "6", name: "Retail West Africa Fund", description: "Specialized fund for retail supply chain optimization and last-mile logistics solutions across West Africa.", tags: ["Logistics", "SME", "Seed"], avgTicket: "$125k", matchPercent: 65, status: "Low Activity", icon: "dollar" },
];

const InvestorsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [ticketSize, setTicketSize] = useState("all");
  const [region, setRegion] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorData | null>(null);

  const clearFilters = () => { setIndustry("all"); setTicketSize("all"); setRegion("all"); };

  const filtered = demoInvestors.filter((inv) => {
    if (searchQuery && !inv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (industry !== "all" && !inv.tags.some(t => t.toLowerCase().includes(industry))) return false;
    return true;
  });

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
            Shortlisted (12)
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <InvestorCard investor={inv} onView={() => setSelectedInvestor(inv)} />
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
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <h3 className="font-display text-lg font-bold">Shortlisted Investors</h3>
            <p className="mt-2 text-sm text-muted-foreground">Track investors you're interested in connecting with.</p>
          </div>
        </TabsContent>

        <TabsContent value="outreach" className="mt-5">
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <h3 className="font-display text-lg font-bold">Outreach History</h3>
            <p className="mt-2 text-sm text-muted-foreground">View your past investor communications and connection requests.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorsPage;
