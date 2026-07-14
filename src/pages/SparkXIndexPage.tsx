import { useState, useMemo } from "react";
import { Building2, Users, LayoutGrid, List, Filter, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { IndexSearchBar } from "@/components/sparkx-index/IndexSearchBar";
import { StageFilterChips } from "@/components/sparkx-index/StageFilterChips";
import { IndexStartupCard } from "@/components/sparkx-index/IndexStartupCard";
import { IndexStartupDetailModal } from "@/components/sparkx-index/IndexStartupDetailModal";
import { IndexInvestorCard } from "@/components/sparkx-index/IndexInvestorCard";
import { IndexInvestorListItem } from "@/components/sparkx-index/IndexInvestorListItem";
import { IndexInvestorDetailModal } from "@/components/sparkx-index/IndexInvestorDetailModal";
import { useIndexStartups, useStartupRounds, STAGES, SECTORS, type IndexStartup } from "@/hooks/useIndexStartups";
import { useIndexInvestors, INVESTOR_TYPES, type IndexInvestor } from "@/hooks/useIndexInvestors";

export default function SparkXIndexPage() {
  const [activeTab, setActiveTab] = useState<"startups" | "investors">("startups");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [sector, setSector] = useState("all");
  const [location, setLocation] = useState("");
  const [raising, setRaising] = useState(false);
  const [investorType, setInvestorType] = useState("all");
  const [investorSector, setInvestorSector] = useState("all");
  const [investorView, setInvestorView] = useState<"card" | "list">("card");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedStartup, setSelectedStartup] = useState<IndexStartup | null>(null);
  const [startupDetailOpen, setStartupDetailOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<IndexInvestor | null>(null);
  const [investorDetailOpen, setInvestorDetailOpen] = useState(false);

  const { data: startups = [], isLoading: loadingStartups } = useIndexStartups({
    search: activeTab === "startups" ? search : undefined,
    sector: activeTab === "startups" ? sector : undefined,
    stage: activeTab === "startups" ? stage : undefined,
    location: activeTab === "startups" ? location : undefined,
    raising: activeTab === "startups" ? raising : undefined,
  });

  const startupIds = useMemo(() => startups.slice(0, 50).map(s => s.id), [startups]);
  const { data: roundsMap = new Map() } = useStartupRounds(startupIds);

  const { data: investors = [], isLoading: loadingInvestors } = useIndexInvestors({
    search: activeTab === "investors" ? search : undefined,
    type: activeTab === "investors" ? investorType : undefined,
    sector: activeTab === "investors" && investorSector !== "all" ? investorSector : undefined,
  });

  const handleStartupClick = (startup: IndexStartup) => {
    setSelectedStartup(startup);
    setStartupDetailOpen(true);
  };

  const handleInvestorClick = (investor: IndexInvestor) => {
    setSelectedInvestor(investor);
    setInvestorDetailOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setStage("all");
    setSector("all");
    setLocation("");
    setRaising(false);
    setInvestorType("all");
    setInvestorSector("all");
  };

  const hasActiveFilters = search || stage !== "all" || sector !== "all" || location || raising || investorType !== "all" || investorSector !== "all";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-background via-background to-primary/5 border-b">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">SparkX Index</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Discover Africa's Leading Startups & Investors
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Search, filter, and explore the most promising startups and investors across the continent.
              </p>
              <div className="max-w-xl mx-auto">
                <IndexSearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder={activeTab === "startups" ? "Search startups..." : "Search investors..."}
                />
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span><strong className="text-foreground">{startups.length}</strong> Startups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span><strong className="text-foreground">{investors.length}</strong> Investors</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "startups" | "investors")}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="h-10">
                <TabsTrigger value="startups" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Startups
                  <Badge variant="secondary" className="ml-1 text-xs">{startups.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="investors" className="gap-2">
                  <Users className="h-4 w-4" />
                  Investors
                  <Badge variant="secondary" className="ml-1 text-xs">{investors.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {activeTab === "investors" && (
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      variant={investorView === "card" ? "default" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setInvestorView("card")}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={investorView === "list" ? "default" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setInvestorView("list")}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1.5"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">!</Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 p-4 border rounded-xl bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                      Clear all
                    </Button>
                  )}
                </div>

                {activeTab === "startups" ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Stage</Label>
                      <StageFilterChips stages={STAGES} selected={stage} onChange={setStage} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Sector</Label>
                        <Select value={sector} onValueChange={setSector}>
                          <SelectTrigger><SelectValue placeholder="All sectors" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sectors</SelectItem>
                            {SECTORS.map(s => (
                              <SelectItem key={s} value={s} className="capitalize">
                                {s.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Location</Label>
                        <IndexSearchBar value={location} onChange={setLocation} placeholder="City or country..." />
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-2">
                          <Switch id="raising" checked={raising} onCheckedChange={setRaising} />
                          <Label htmlFor="raising" className="text-sm">Raising only</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Investor Type</Label>
                      <Select value={investorType} onValueChange={setInvestorType}>
                        <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                          {INVESTOR_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Focus Sector</Label>
                      <Select value={investorSector} onValueChange={setInvestorSector}>
                        <SelectTrigger><SelectValue placeholder="All sectors" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sectors</SelectItem>
                          {SECTORS.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Startups Tab */}
            <div hidden={activeTab !== "startups"}>
              {loadingStartups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : startups.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No startups found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {startups.map(startup => (
                    <IndexStartupCard
                      key={startup.id}
                      startup={startup}
                      onClick={() => handleStartupClick(startup)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Investors Tab */}
            <div hidden={activeTab !== "investors"}>
              {loadingInvestors ? (
                investorView === "card" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                )
              ) : investors.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No investors found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
                </div>
              ) : investorView === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {investors.map(investor => (
                    <IndexInvestorCard
                      key={investor.id}
                      investor={investor}
                      onClick={() => handleInvestorClick(investor)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {investors.map(investor => (
                    <IndexInvestorListItem
                      key={investor.id}
                      investor={investor}
                      onClick={() => handleInvestorClick(investor)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />

      <IndexStartupDetailModal
        startup={selectedStartup}
        rounds={selectedStartup ? (roundsMap.get(selectedStartup.id) ?? []) : []}
        open={startupDetailOpen}
        onOpenChange={setStartupDetailOpen}
      />

      <IndexInvestorDetailModal
        investor={selectedInvestor}
        open={investorDetailOpen}
        onOpenChange={setInvestorDetailOpen}
      />
    </div>
  );
}
