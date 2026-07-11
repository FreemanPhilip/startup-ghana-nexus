import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, MapPin, Wallet, Globe, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IndexInvestor = Database["public"]["Tables"]["index_investors"]["Row"];
type IndexStartup = Database["public"]["Tables"]["index_startups"]["Row"];
type IndexRound = Database["public"]["Tables"]["index_funding_rounds"]["Row"];

type PortfolioItem = {
  startup: IndexStartup;
  rounds: (IndexRound & { is_lead: boolean })[];
};

const prettify = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const formatUsd = (n: number | null | undefined) => n == null ? null :
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` :
  n >= 1_000 ? `$${(n / 1_000).toFixed(0)}k` : `$${n}`;

const InvestorDetailPage = () => {
  const { slug } = useParams();
  const [investor, setInvestor] = useState<IndexInvestor | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: inv } = await supabase
        .from("index_investors")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!inv) { setLoading(false); return; }
      setInvestor(inv);

      // Rounds this investor is part of
      const { data: links } = await supabase
        .from("index_round_investors")
        .select("is_lead, round_id, index_funding_rounds(*)")
        .eq("index_investor_id", inv.id);

      const rounds = (links ?? [])
        .map((l: any) => l.index_funding_rounds ? { ...l.index_funding_rounds, is_lead: !!l.is_lead } : null)
        .filter(Boolean) as (IndexRound & { is_lead: boolean })[];

      const startupIds = Array.from(new Set(rounds.map(r => r.index_startup_id)));
      if (startupIds.length === 0) { setPortfolio([]); setLoading(false); return; }

      const { data: startups } = await supabase
        .from("index_startups")
        .select("*")
        .in("id", startupIds);

      const grouped: PortfolioItem[] = (startups ?? []).map(st => ({
        startup: st,
        rounds: rounds
          .filter(r => r.index_startup_id === st.id)
          .sort((a, b) => (b.announced_on ?? "").localeCompare(a.announced_on ?? "")),
      })).sort((a, b) => a.startup.name.localeCompare(b.startup.name));

      setPortfolio(grouped);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-16">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-16 text-center">
          <p className="text-muted-foreground">Investor not found.</p>
          <Link to="/investors" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to investors
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = investor.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const check = [formatUsd(investor.check_size_min as any), formatUsd(investor.check_size_max as any)].filter(Boolean).join(" – ");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <Link to="/investors" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All investors
        </Link>

        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {investor.logo_url ? (
              <img src={investor.logo_url} alt={investor.name} className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{investor.name}</h1>
                {investor.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {investor.type && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {prettify(investor.type)}</span>}
                {investor.hq_country && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {investor.hq_country}</span>}
                {investor.website_url && (
                  <a href={investor.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
              </div>
              {investor.description && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">{investor.description}</p>
              )}
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-4 w-4" /> Ticket Size
            </h2>
            <p className="text-lg font-semibold">{check || <span className="text-muted-foreground">Not disclosed</span>}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sector Focus</h2>
            {(investor.focus_sectors?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">Sector-agnostic</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {investor.focus_sectors!.map(s => (
                  <Badge key={s as string} variant="secondary">{prettify(s as string)}</Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        {(investor.stage_focus?.length ?? 0) > 0 && (
          <section className="mt-4 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stage Focus</h2>
            <div className="flex flex-wrap gap-1.5">
              {investor.stage_focus!.map(s => (
                <Badge key={s as string} variant="outline">{prettify(s as string)}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold">Portfolio</h2>
          {portfolio.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No portfolio investments recorded yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {portfolio.map(({ startup, rounds }) => (
                <div key={startup.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/startups/${startup.slug}`} className="flex items-start gap-3 group">
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt={startup.name} className="h-11 w-11 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {startup.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold group-hover:text-primary">{startup.name}</h3>
                          {startup.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {startup.sector && <Badge variant="secondary" className="text-[10px]">{prettify(startup.sector)}</Badge>}
                          {startup.country && <span>{startup.country}</span>}
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {rounds.map(r => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{prettify(r.round_type)}</Badge>
                          {r.is_lead && <Badge className="bg-primary/15 text-primary hover:bg-primary/20">Lead</Badge>}
                          <span className="text-muted-foreground">
                            {r.announced_on ? new Date(r.announced_on).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "Date unknown"}
                          </span>
                        </div>
                        {r.amount_usd != null && (
                          <span className="font-medium">{formatUsd(Number(r.amount_usd))}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorDetailPage;
