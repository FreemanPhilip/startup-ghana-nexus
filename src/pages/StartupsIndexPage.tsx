import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, BadgeCheck, MapPin, Flame, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IndexStartup = Database["public"]["Tables"]["index_startups"]["Row"];

const SECTORS: Database["public"]["Enums"]["index_sector"][] = [
  "fintech","agritech","healthtech","edtech","ecommerce","logistics","energy",
  "creative","mobility","proptech","insurtech","cleantech","ai","saas","deeptech","media","other",
];
const STAGES: Database["public"]["Enums"]["index_stage"][] = [
  "idea","pre_seed","seed","series_a","series_b","series_c","growth","mature",
];

const prettify = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const StartupsIndexPage = () => {
  const [rows, setRows] = useState<IndexStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [location, setLocation] = useState("");
  const [raisingOnly, setRaisingOnly] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("index_startups")
        .select("*")
        .order("sparkx_score", { ascending: false, nullsFirst: false });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    return rows.filter(r => {
      if (sector !== "all" && r.sector !== sector) return false;
      if (stage !== "all" && r.stage !== stage) return false;
      if (raisingOnly && !r.is_raising) return false;
      if (loc) {
        const hay = `${r.country ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!hay.includes(loc)) return false;
      }
      if (term) {
        const hay = `${r.name} ${r.description ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, sector, stage, location, raisingOnly]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Startups Directory</h1>
          <p className="mt-2 text-muted-foreground">
            The pan-African startup index — discover, rank, and follow ventures ranked by SparkX Score.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-8 space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search startups by name or description"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sectors</SelectItem>
                {SECTORS.map(s => <SelectItem key={s} value={s}>{prettify(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGES.map(s => <SelectItem key={s} value={s}>{prettify(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Location (country or city)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <div className="flex items-center justify-between rounded-md border border-input px-3">
              <Label htmlFor="raising" className="cursor-pointer text-sm">Raising now</Label>
              <Switch id="raising" checked={raisingOnly} onCheckedChange={setRaisingOnly} />
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No startups match your filters.
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} startup{filtered.length === 1 ? "" : "s"}</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(s => <StartupCard key={s.id} s={s} />)}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

const StartupCard = ({ s }: { s: IndexStartup }) => {
  const initials = s.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Link
      to={`/startups/${s.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        {s.logo_url ? (
          <img src={s.logo_url} alt={s.name} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold group-hover:text-primary">{s.name}</h3>
            {s.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
          </div>
          {(s.country || s.city) && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[s.city, s.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        {s.sparkx_score != null && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-lg font-bold leading-none">{Number(s.sparkx_score).toFixed(0)}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">SparkX Rank</span>
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {s.description || "No description yet."}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {s.sector && <Badge variant="secondary">{prettify(s.sector)}</Badge>}
        {s.stage && <Badge variant="outline">{prettify(s.stage)}</Badge>}
        {s.is_raising && (
          <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">
            <Flame className="h-3 w-3" /> Raising
          </Badge>
        )}
      </div>
    </Link>
  );
};

export default StartupsIndexPage;
