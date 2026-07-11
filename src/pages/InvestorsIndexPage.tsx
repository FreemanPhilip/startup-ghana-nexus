import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, BadgeCheck, MapPin, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IndexInvestor = Database["public"]["Tables"]["index_investors"]["Row"];

const TYPES: Database["public"]["Enums"]["index_investor_type"][] = [
  "vc", "angel", "accelerator", "corporate", "dfi", "family_office", "syndicate", "government", "other",
];
const SECTORS: Database["public"]["Enums"]["index_sector"][] = [
  "fintech","agritech","healthtech","edtech","ecommerce","logistics","energy",
  "creative","mobility","proptech","insurtech","cleantech","ai","saas","deeptech","media","other",
];

const prettify = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const formatUsd = (n: number | null) => n == null ? null :
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` :
  n >= 1_000 ? `$${(n / 1_000).toFixed(0)}k` : `$${n}`;

const InvestorsIndexPage = () => {
  const [rows, setRows] = useState<IndexInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("index_investors")
        .select("*")
        .order("verified", { ascending: false })
        .order("name", { ascending: true });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (type !== "all" && r.type !== type) return false;
      if (sector !== "all" && !(r.focus_sectors ?? []).includes(sector as any)) return false;
      if (term && !r.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, q, type, sector]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Investors Directory</h1>
          <p className="mt-2 text-muted-foreground">
            Browse the investors backing Africa's startup ecosystem — VCs, angels, accelerators and more.
          </p>
        </header>

        <div className="mb-8 space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search investors by name"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Investor type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPES.map(t => <SelectItem key={t} value={t}>{prettify(t)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue placeholder="Sector focus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sectors</SelectItem>
                {SECTORS.map(s => <SelectItem key={s} value={s}>{prettify(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No investors match your filters.
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} investor{filtered.length === 1 ? "" : "s"}</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(i => <InvestorCard key={i.id} i={i} />)}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

const InvestorCard = ({ i }: { i: IndexInvestor }) => {
  const initials = i.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const check = [formatUsd(i.check_size_min as any), formatUsd(i.check_size_max as any)].filter(Boolean).join(" – ");
  return (
    <Link
      to={`/investors/${i.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        {i.logo_url ? (
          <img src={i.logo_url} alt={i.name} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold group-hover:text-primary">{i.name}</h3>
            {i.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
          </div>
          {i.hq_country && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {i.hq_country}
            </p>
          )}
        </div>
      </div>

      {i.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
      )}

      {check && (
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Wallet className="h-3 w-3" /> Check size: {check}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {i.type && <Badge variant="secondary">{prettify(i.type)}</Badge>}
        {(i.focus_sectors ?? []).slice(0, 3).map(s => (
          <Badge key={s} variant="outline">{prettify(s as string)}</Badge>
        ))}
        {(i.focus_sectors?.length ?? 0) > 3 && (
          <Badge variant="outline">+{(i.focus_sectors!.length - 3)}</Badge>
        )}
      </div>
    </Link>
  );
};

export default InvestorsIndexPage;
