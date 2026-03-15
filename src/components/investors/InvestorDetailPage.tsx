import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Building2, DollarSign, Landmark, Users2, Briefcase, Globe, MapPin, Mail, Phone, ExternalLink, CheckCircle2, TrendingUp, Target, Calendar, Star, MessageCircle, Bookmark, BookmarkCheck, BarChart3, Sparkles, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "@/hooks/use-toast";
import type { InvestorData } from "./InvestorCard";
import RequestIntroDialog from "./RequestIntroDialog";

const iconMap: Record<string, React.ElementType> = {
  building: Building2,
  landmark: Landmark,
  users: Users2,
  briefcase: Briefcase,
  globe: Globe,
  dollar: DollarSign,
};

// Extended demo data for detail view
const investorDetails: Record<string, {
  founded: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  fundSize: string;
  investmentStage: string[];
  sectors: string[];
  portfolio: { name: string; stage: string; year: string }[];
  teamMembers: { name: string; role: string; initials: string }[];
  recentActivity: { text: string; date: string }[];
  thesis: string;
  criteria: string[];
}> = {
  "1": {
    founded: "2019",
    location: "Accra, Greater Accra",
    website: "https://accravp.com",
    email: "deals@accravp.com",
    phone: "+233 30 277 5500",
    fundSize: "GH₵120M",
    investmentStage: ["Pre-Seed", "Seed"],
    sectors: ["FinTech", "E-Commerce", "B2B SaaS", "Payments"],
    portfolio: [
      { name: "PayStack Africa", stage: "Seed", year: "2023" },
      { name: "FarmConnect", stage: "Pre-Seed", year: "2024" },
      { name: "MediTrack", stage: "Seed", year: "2024" },
      { name: "ShopLocal", stage: "Pre-Seed", year: "2023" },
    ],
    teamMembers: [
      { name: "Kwame Asante", role: "Managing Partner", initials: "KA" },
      { name: "Ama Boateng", role: "Investment Associate", initials: "AB" },
      { name: "Yaw Mensah", role: "Portfolio Manager", initials: "YM" },
    ],
    recentActivity: [
      { text: "Led GH₵2.5M seed round for MediTrack", date: "2 weeks ago" },
      { text: "Participated in Accra Startup Week panel", date: "1 month ago" },
      { text: "Published: 'State of FinTech in Africa 2025'", date: "2 months ago" },
    ],
    thesis: "We invest in bold founders building category-defining FinTech and commerce solutions for West Africa. We look for strong product-market fit signals, a clear path to unit economics, and founders with deep domain expertise.",
    criteria: [
      "Ghana-based or Ghana-focused startups",
      "Post-MVP with early traction (MRR > GH₵20k)",
      "Founding team with relevant industry experience",
      "Clear monetization strategy",
      "Addressable market > GH₵1B",
    ],
  },
  "2": {
    founded: "2017",
    location: "Kumasi, Ashanti Region",
    website: "https://gcfimpact.org",
    email: "apply@gcfimpact.org",
    phone: "+233 32 202 4400",
    fundSize: "GH₵450M",
    investmentStage: ["Series A", "Series B"],
    sectors: ["CleanTech", "Renewable Energy", "AgriTech", "Impact"],
    portfolio: [
      { name: "SolarGhana", stage: "Series A", year: "2022" },
      { name: "AquaClean Tech", stage: "Series A", year: "2023" },
      { name: "GreenHarvest", stage: "Series B", year: "2024" },
    ],
    teamMembers: [
      { name: "Dr. Nana Osei", role: "Fund Director", initials: "NO" },
      { name: "Efua Mensah", role: "Climate Lead", initials: "EM" },
    ],
    recentActivity: [
      { text: "Closed GH₵80M Series A for AquaClean Tech", date: "3 weeks ago" },
      { text: "Launched Climate Innovation Challenge", date: "1 month ago" },
    ],
    thesis: "We back scalable climate and sustainability solutions across West Africa. Our capital supports ventures that demonstrate measurable environmental impact alongside strong financial returns.",
    criteria: [
      "Revenue-generating companies (GH₵500k+ ARR)",
      "Measurable climate/social impact metrics",
      "Scalable technology-driven solutions",
      "Strong governance and reporting capabilities",
    ],
  },
};

const getDefaultDetail = (investor: InvestorData) => ({
  founded: "2020",
  location: "Accra, Ghana",
  website: "#",
  email: `info@${investor.name.toLowerCase().replace(/\s+/g, "")}.com`,
  phone: "+233 XX XXX XXXX",
  fundSize: investor.avgTicket.replace("$", "$") + " avg",
  investmentStage: investor.tags.filter(t => ["Pre-Seed", "Seed", "Series A", "Series B", "Growth"].includes(t)),
  sectors: investor.tags.filter(t => !["Pre-Seed", "Seed", "Series A", "Series B", "Growth", "Equity", "Debt", "SME"].includes(t)),
  portfolio: [],
  teamMembers: [{ name: "Investment Team", role: "Managing Partner", initials: "IT" }],
  recentActivity: [{ text: "Fund actively reviewing applications", date: "Recently" }],
  thesis: investor.description,
  criteria: ["Active fund accepting applications"],
});

const getMatchColor = (pct: number) => {
  if (pct >= 90) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (pct >= 80) return "bg-primary/10 text-primary border-primary/20";
  if (pct >= 70) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-muted text-muted-foreground border-border";
};

interface MatchedStartup {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  stage: string | null;
  location: string | null;
  short_description: string | null;
}

interface InvestorDetailPageProps {
  investor: InvestorData;
  onBack: () => void;
  onViewStartup?: (startupId: string) => void;
}

const INITIAL_PORTFOLIO_COUNT = 4;

const InvestorDetailPage = ({ investor, onBack, onViewStartup }: InvestorDetailPageProps) => {
  const { user } = useAuth();
  const { sendRequest, getRequestStatus } = useConnections();
  const [shortlisted, setShortlisted] = useState(false);
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);
  const [platformStartups, setPlatformStartups] = useState<MatchedStartup[]>([]);
  const [showIntroDialog, setShowIntroDialog] = useState(false);
  const [userStartups, setUserStartups] = useState<{ id: string; name: string }[]>([]);
  const [investorUserId, setInvestorUserId] = useState<string | null>(null);

  const detail = investorDetails[investor.id] || getDefaultDetail(investor);
  const Icon = iconMap[investor.icon] || Building2;

  // Fetch real startups from the platform that match portfolio names
  useEffect(() => {
    if (detail.portfolio.length === 0) return;
    const fetchStartups = async () => {
      const { data } = await supabase
        .from("startups")
        .select("id, name, logo_url, industry, stage, location, short_description")
        .limit(50);
      if (data) setPlatformStartups(data);
    };
    fetchStartups();
  }, [detail.portfolio.length]);

  // Fetch user's own startups for the intro dialog
  useEffect(() => {
    if (!user) return;
    const fetchUserStartups = async () => {
      const { data } = await supabase
        .from("startup_members")
        .select("startup_id, startups(id, name)")
        .eq("user_id", user.id)
        .eq("confirmed", true);
      if (data) {
        setUserStartups(data.filter(d => d.startups).map(d => ({
          id: (d.startups as any).id,
          name: (d.startups as any).name,
        })));
      }
    };
    fetchUserStartups();
  }, [user]);

  // Try to find investor's user_id on the platform by matching name
  useEffect(() => {
    const findInvestor = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, company_name, full_name")
        .or(`company_name.ilike.%${investor.name}%,full_name.ilike.%${investor.name}%`)
        .limit(1);
      if (data && data.length > 0) {
        setInvestorUserId(data[0].user_id);
      }
    };
    findInvestor();
  }, [investor.name]);

  const handleSendIntro = async (message: string, startupId?: string, pitchDeckUrl?: string) => {
    if (!investorUserId) {
      toast({ title: "Investor not on platform", description: "This investor doesn't have a platform profile yet. Your request has been noted.", variant: "destructive" });
      return false;
    }
    const status = getRequestStatus(investorUserId);
    if (status === "connected") {
      toast({ title: "Already connected", description: "You're already connected with this investor." });
      return false;
    }
    if (status === "pending_sent") {
      toast({ title: "Request already sent", description: "You already have a pending intro request." });
      return false;
    }
    const parts = ["[Intro Request"];
    if (startupId) parts[0] += ` via ${userStartups.find(s => s.id === startupId)?.name || "startup"}`;
    parts[0] += "]";
    if (pitchDeckUrl) parts.push(`[Pitch Deck: ${pitchDeckUrl}]`);
    parts.push(message);
    const fullMessage = parts.join(" ");
    const ok = await sendRequest(investorUserId, fullMessage);
    if (ok) toast({ title: "Intro request sent!", description: `Your request has been sent to ${investor.name}.` });
    return ok;
  };

  // Match portfolio entries to real startups by fuzzy name matching
  const portfolioWithMatches = useMemo(() => {
    return detail.portfolio.map(co => {
      const matched = platformStartups.find(s =>
        s.name.toLowerCase().includes(co.name.toLowerCase()) ||
        co.name.toLowerCase().includes(s.name.toLowerCase())
      );
      return { ...co, matchedStartup: matched || null };
    });
  }, [detail.portfolio, platformStartups]);

  // Also show platform startups not in the static list (as "also on platform")
  const additionalPlatformStartups = useMemo(() => {
    const matchedIds = new Set(portfolioWithMatches.filter(p => p.matchedStartup).map(p => p.matchedStartup!.id));
    return platformStartups.filter(s => !matchedIds.has(s.id));
  }, [platformStartups, portfolioWithMatches]);

  const allPortfolioItems = [
    ...portfolioWithMatches,
    ...additionalPlatformStartups.map(s => ({
      name: s.name,
      stage: s.stage || "—",
      year: "On Platform",
      matchedStartup: s,
    })),
  ];

  const visiblePortfolio = showAllPortfolio
    ? allPortfolioItems
    : allPortfolioItems.slice(0, INITIAL_PORTFOLIO_COUNT);

  const hasMore = allPortfolioItems.length > INITIAL_PORTFOLIO_COUNT;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/80 via-primary to-primary/60 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2ek0wIDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZTMy4zMTQgNiAwIDYtNiA4LjY4Ni02IDEycy4yNjg2IDYgNiA2ek0xOCAzNmMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <Button variant="ghost" size="icon" className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm hover:bg-card" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-card border border-t-0 border-border px-5 sm:px-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-card border-4 border-card shadow-lg bg-primary/10">
              <Icon className="h-9 w-9 text-primary" />
            </div>

            <div className="flex-1 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-xl font-bold">{investor.name}</h1>
                    <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${getMatchColor(investor.matchPercent)}`}>
                      {investor.matchPercent}% Match
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {detail.sectors.join(" · ")} · Est. {detail.founded}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setShortlisted(!shortlisted)}
                  >
                    {shortlisted ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
                    {shortlisted ? "Shortlisted" : "Shortlist"}
                  </Button>
                  <Button size="sm" className="gap-1.5 text-xs font-semibold" onClick={() => setShowIntroDialog(true)}>
                    <MessageCircle className="h-3.5 w-3.5" /> Request Intro
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Investment Thesis */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Investment Thesis
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.thesis}</p>
          </div>

          {/* Investment Criteria */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> What They Look For
            </h3>
            <ul className="space-y-2">
              {detail.criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Portfolio Companies — Enhanced */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Portfolio ({allPortfolioItems.length})
              </h3>
              {platformStartups.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-medium gap-1 border-primary/20 text-primary">
                  <Building2 className="h-3 w-3" />
                  {platformStartups.length} on platform
                </Badge>
              )}
            </div>

            {allPortfolioItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Portfolio information not publicly available.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visiblePortfolio.map((co, i) => {
                    const startup = co.matchedStartup;
                    const isOnPlatform = !!startup;

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                          isOnPlatform
                            ? "border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer group"
                            : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          if (isOnPlatform && onViewStartup) {
                            onViewStartup(startup.id);
                          }
                        }}
                      >
                        {/* Logo / Icon */}
                        {startup?.logo_url ? (
                          <Avatar className="h-10 w-10 rounded-lg shrink-0">
                            <AvatarImage src={startup.logo_url} className="object-cover" />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                              {co.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate">{startup?.name || co.name}</p>
                            {isOnPlatform && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {startup?.industry ? `${startup.industry} · ` : ""}
                            {co.stage} · {co.year}
                          </p>
                          {startup?.short_description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                              {startup.short_description}
                            </p>
                          )}
                        </div>

                        {/* View button for on-platform startups */}
                        {isOnPlatform && onViewStartup && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewStartup(startup.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* View More / View Less */}
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 gap-1.5 text-xs text-primary font-semibold hover:bg-primary/5"
                    onClick={() => setShowAllPortfolio(!showAllPortfolio)}
                  >
                    {showAllPortfolio ? (
                      <>Show Less</>
                    ) : (
                      <>
                        View All {allPortfolioItems.length} Companies
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {detail.recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:w-72 shrink-0 space-y-5">
          {/* Key Metrics */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fund Size</span>
                  <span className="text-sm font-bold text-primary">{detail.fundSize}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Ticket</span>
                  <span className="text-sm font-bold text-primary">{investor.avgTicket}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Portfolio</span>
                  <span className="text-sm font-bold text-foreground">{allPortfolioItems.length} companies</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Investment Stages</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {detail.investmentStage.map(s => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Match Breakdown */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Match Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: "Industry Fit", value: Math.min(100, investor.matchPercent + 2) },
                { label: "Stage Alignment", value: Math.min(100, investor.matchPercent - 5) },
                { label: "Ticket Size", value: Math.min(100, investor.matchPercent + 8) },
                { label: "Geographic", value: Math.min(100, investor.matchPercent - 2) },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{detail.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{detail.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{detail.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <a href={detail.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{detail.website}</a>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3">Investment Team</h3>
            <div className="space-y-3">
              {detail.teamMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Focus */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3">Sector Focus</h3>
            <div className="flex flex-wrap gap-1.5">
              {detail.sectors.map(s => (
                <Badge key={s} className="text-[10px] bg-primary/10 text-primary border-0">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Request Intro Dialog */}
      <RequestIntroDialog
        open={showIntroDialog}
        onOpenChange={setShowIntroDialog}
        investorName={investor.name}
        onSend={handleSendIntro}
        startups={userStartups}
      />
    </div>
  );
};

export default InvestorDetailPage;
