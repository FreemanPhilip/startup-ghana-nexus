import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BadgeCheck, Building2, DollarSign, Flame, Sparkles, TrendingUp, Users, Calendar, Newspaper } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ---------- Shared: Featured strip ---------- */
const FeaturedStrip = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("index_startups")
        .select("id, name, slug, logo_url, sector, sparkx_score")
        .eq("is_featured", true)
        .order("featured_at", { ascending: false })
        .limit(3);
      setItems(data || []);
    })();
  }, []);
  if (!items.length) return null;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Featured this week</h2>
        <span className="text-xs text-muted-foreground">— editorial picks</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((s) => (
          <Link key={s.id} to={`/startups/${s.slug}`} className="group rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4 hover:border-primary transition-colors">
            <div className="flex items-center gap-3">
              {s.logo_url ? <img src={s.logo_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center font-bold text-primary">{s.name.charAt(0)}</div>}
              <div className="min-w-0">
                <div className="font-semibold truncate group-hover:text-primary">{s.name}</div>
                <div className="text-xs text-muted-foreground truncate">{(s.sector || "").replace(/_/g, " ")}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-lg font-bold text-primary">{Math.round(Number(s.sparkx_score) || 0)}</div>
                <div className="text-[10px] text-muted-foreground">SparkX</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ---------- Founder ---------- */
const FounderHome = () => {
  const { user } = useAuth();
  const [startup, setStartup] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [investors, setInvestors] = useState<any[]>([]);
  const [rounds, setRounds] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Find member startup owned by user
      const { data: memberships } = await supabase.from("startup_members").select("startup_id").eq("user_id", user.id).in("role", ["owner", "admin"]);
      const ids = (memberships || []).map((m: any) => m.startup_id);
      if (!ids.length) return;
      const { data: idx } = await (supabase as any)
        .from("index_startups")
        .select("*")
        .in("claimed_by_startup_id", ids)
        .order("sparkx_score", { ascending: false })
        .maybeSingle();
      if (!idx) return;
      setStartup(idx);
      const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
      setFollowerCount(count || 0);
      const { count: rCount } = await (supabase as any).from("index_funding_rounds").select("*", { count: "exact", head: true }).eq("index_startup_id", idx.id);
      setRounds(rCount || 0);
      if (idx.sector) {
        const { data: inv } = await (supabase as any)
          .from("index_investors")
          .select("id, name, slug, type, sectors_focus")
          .contains("sectors_focus", [idx.sector])
          .limit(6);
        setInvestors(inv || []);
      }
    })();
  }, [user]);

  if (!startup) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold">You haven't claimed a startup yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Find your company in <Link to="/startups" className="text-primary underline">The Index</Link> and press "Claim this startup".
        </p>
      </div>
    );
  }

  // Score checklist (mirrors compute_sparkx_score)
  const checks = [
    { pts: 5, done: !!startup.logo_url, label: "Add a logo" },
    { pts: 5, done: (startup.description || "").length > 100, label: "Write a description longer than 100 characters" },
    { pts: 5, done: !!startup.website_url, label: "Add a website URL" },
    { pts: 5, done: !!startup.team_size && startup.team_size > 0, label: "Add team size" },
    { pts: 5, done: !!startup.founded_year, label: "Add founded year" },
    { pts: 5, done: !!startup.sector, label: "Set a sector" },
    { pts: 20, done: !!startup.verified, label: "Get verified" },
    { pts: 10, done: rounds >= 1, label: "Log at least one funding round" },
  ];
  const missing = checks.filter((c) => !c.done);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="SparkX Rank" value={Math.round(Number(startup.sparkx_score) || 0)} icon={TrendingUp} />
        <StatCard label="Followers" value={followerCount} icon={Users} />
        <StatCard label="Profile views" value={0} icon={Users} hint="Coming soon" />
        <StatCard label="Funding rounds" value={rounds} icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold">Complete your profile</h3>
          {missing.length === 0 ? (
            <p className="text-sm text-muted-foreground">You've unlocked all profile points. Great job!</p>
          ) : (
            <ul className="space-y-2">
              {missing.map((c) => (
                <li key={c.label} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <span className="text-sm">{c.label}</span>
                  <Badge variant="outline" className="text-[10px]">+{c.pts} pts</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to={`/startups/${startup.slug}`} className="mt-4 inline-flex text-sm text-primary hover:underline">View your public page →</Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold">Investors in your sector</h3>
          {investors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching investors yet.</p>
          ) : (
            <ul className="space-y-2">
              {investors.map((inv) => (
                <li key={inv.id}>
                  <Link to={`/investors/${inv.slug}`} className="block rounded-lg border border-border p-2 hover:border-primary transition-colors">
                    <div className="text-sm font-semibold">{inv.name}</div>
                    <div className="text-xs text-muted-foreground">{(inv.type || "").replace(/_/g, " ")}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Investor ---------- */
const InvestorHome = () => {
  const { user } = useAuth();
  const [top, setTop] = useState<any[]>([]);
  const [raising, setRaising] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: me } = await (supabase as any).from("index_investors").select("sectors_focus").eq("created_by", user.id).maybeSingle();
      const sectors: string[] = me?.sectors_focus || [];

      let topQuery = (supabase as any).from("index_startups").select("id, name, slug, logo_url, sector, sparkx_score").order("sparkx_score", { ascending: false }).limit(10);
      if (sectors.length) topQuery = topQuery.in("sector", sectors);
      const { data: topStartups } = await topQuery;
      setTop(topStartups || []);

      let raiseQuery = (supabase as any).from("index_startups").select("id, name, slug, logo_url, sector").eq("is_raising", true).order("sparkx_score", { ascending: false }).limit(8);
      if (sectors.length) raiseQuery = raiseQuery.in("sector", sectors);
      const { data: r } = await raiseQuery;
      setRaising(r || []);

      const { data: recentRounds } = await (supabase as any)
        .from("index_funding_rounds")
        .select("id, amount_usd, round_type, announced_on, index_startup:index_startups(name, slug)")
        .eq("verified", true)
        .order("announced_on", { ascending: false, nullsFirst: false })
        .limit(6);
      setRounds(recentRounds || []);
    })();
  }, [user]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top 10 by SparkX Rank</h3>
          <ol className="space-y-2">
            {top.map((s, i) => (
              <li key={s.id}>
                <Link to={`/startups/${s.slug}`} className="flex items-center gap-3 rounded-lg border border-border p-2 hover:border-primary transition-colors">
                  <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  {s.logo_url ? <img src={s.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{(s.sector || "").replace(/_/g, " ")}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{Math.round(Number(s.sparkx_score) || 0)}</div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Newest verified rounds</h3>
          <ul className="space-y-2">
            {rounds.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <Link to={`/startups/${r.index_startup?.slug}`} className="font-semibold hover:text-primary">{r.index_startup?.name}</Link>
                  <span className="text-muted-foreground">raised</span>
                  <span className="font-semibold">${(r.amount_usd || 0).toLocaleString()}</span>
                  <Badge variant="outline" className="text-[10px]">{(r.round_type || "").replace(/_/g, " ")}</Badge>
                </div>
                {r.announced_on && <div className="text-xs text-muted-foreground mt-1">{new Date(r.announced_on).toLocaleDateString()}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-bold flex items-center gap-2"><Flame className="h-4 w-4 text-amber-500" /> Raising now</h3>
        <ul className="space-y-2">
          {raising.map((s) => (
            <li key={s.id}>
              <Link to={`/startups/${s.slug}`} className="flex items-center gap-2 rounded-lg border border-border p-2 hover:border-primary transition-colors">
                {s.logo_url ? <img src={s.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{(s.sector || "").replace(/_/g, " ")}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ---------- Ecosystem Dashboard (government / development_partner) ---------- */
const CHART_COLORS = ["#0B6E4F", "#F5B700", "#0A192F", "#3B82F6", "#EF4444", "#8B5CF6", "#10B981", "#F97316"];

export const EcosystemDashboard = () => {
  const [stats, setStats] = useState({ total: 0, verifiedFunding: 0, roundsQuarter: 0 });
  const [bySector, setBySector] = useState<any[]>([]);
  const [byStage, setByStage] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { count: total } = await (supabase as any).from("index_startups").select("*", { count: "exact", head: true });
      const { data: rounds } = await (supabase as any).from("index_funding_rounds").select("amount_usd, announced_on, index_startup_id, index_startup:index_startups(sector)").eq("verified", true);
      const sum = (rounds || []).reduce((a: number, r: any) => a + (Number(r.amount_usd) || 0), 0);
      const qStart = new Date(); qStart.setMonth(qStart.getMonth() - 3);
      const rQ = (rounds || []).filter((r: any) => r.announced_on && new Date(r.announced_on) >= qStart).length;
      setStats({ total: total || 0, verifiedFunding: sum, roundsQuarter: rQ });

      const sectorMap = new Map<string, number>();
      (rounds || []).forEach((r: any) => {
        const s = r.index_startup?.sector || "unknown";
        sectorMap.set(s, (sectorMap.get(s) || 0) + (Number(r.amount_usd) || 0));
      });
      setBySector([...sectorMap.entries()].map(([name, value]) => ({ name: name.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value).slice(0, 8));

      const { data: stages } = await (supabase as any).from("index_startups").select("stage");
      const stageMap = new Map<string, number>();
      (stages || []).forEach((s: any) => {
        const k = s.stage || "unknown";
        stageMap.set(k, (stageMap.get(k) || 0) + 1);
      });
      setByStage([...stageMap.entries()].map(([name, value]) => ({ name: name.replace(/_/g, " "), value })));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total startups" value={stats.total} icon={Building2} />
        <StatCard label="Verified funding" value={`$${stats.verifiedFunding.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Rounds this quarter" value={stats.roundsQuarter} icon={Calendar} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold">Funding by sector (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySector}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : `${(v / 1e3).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="#0B6E4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold">Startups by stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStage} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {byStage.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Partner (incubator / corporate / bank): rising startups ---------- */
const PartnerHome = () => {
  const [sector, setSector] = useState<string>("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [risers, setRisers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: allSectors } = await (supabase as any).from("index_startups").select("sector");
      const uniq = [...new Set((allSectors || []).map((s: any) => s.sector).filter(Boolean))] as string[];
      setSectors(uniq);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // Fetch history from last 30d + current scores
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data: hist } = await (supabase as any)
        .from("sparkx_score_history")
        .select("index_startup_id, score, captured_at")
        .lte("captured_at", since.toISOString())
        .order("captured_at", { ascending: false })
        .limit(500);
      const oldMap = new Map<string, number>();
      (hist || []).forEach((h: any) => { if (!oldMap.has(h.index_startup_id)) oldMap.set(h.index_startup_id, Number(h.score)); });

      let q = (supabase as any).from("index_startups").select("id, name, slug, logo_url, sector, sparkx_score");
      if (sector) q = q.eq("sector", sector);
      const { data: startups } = await q;
      const scored = (startups || []).map((s: any) => ({
        ...s,
        delta: (Number(s.sparkx_score) || 0) - (oldMap.get(s.id) ?? Number(s.sparkx_score) ?? 0),
      })).sort((a: any, b: any) => b.delta - a.delta).slice(0, 15);
      setRisers(scored);
    })();
  }, [sector]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Rising startups (biggest score gains, last 30 days)</h3>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-sm">
            <option value="">All sectors</option>
            {sectors.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <ul className="space-y-2">
          {risers.map((s, i) => (
            <li key={s.id}>
              <Link to={`/startups/${s.slug}`} className="flex items-center gap-3 rounded-lg border border-border p-2 hover:border-primary transition-colors">
                <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                {s.logo_url ? <img src={s.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{(s.sector || "").replace(/_/g, " ")}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{Math.round(Number(s.sparkx_score) || 0)}</div>
                  <div className={`text-[10px] ${s.delta > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>{s.delta > 0 ? `+${s.delta.toFixed(1)}` : "—"}</div>
                </div>
              </Link>
            </li>
          ))}
          {risers.length === 0 && <li className="text-sm text-muted-foreground py-4 text-center">No score history yet — check back tomorrow.</li>}
        </ul>
      </div>
    </div>
  );
};

/* ---------- Media / University / Student ---------- */
const MediaHome = () => {
  const [rounds, setRounds] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: r } = await (supabase as any)
        .from("index_funding_rounds")
        .select("id, amount_usd, round_type, announced_on, notes, index_startup:index_startups(name, slug, logo_url)")
        .eq("verified", true)
        .order("announced_on", { ascending: false, nullsFirst: false })
        .limit(10);
      setRounds(r || []);
      const { data: t } = await (supabase as any).from("index_startups").select("id, name, slug, logo_url, sector, sparkx_score").order("sparkx_score", { ascending: false }).limit(8);
      setTop(t || []);
    })();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="font-bold text-lg">Latest verified funding</h3>
        {rounds.map((r) => (
          <article key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              {r.index_startup?.logo_url ? <img src={r.index_startup.logo_url} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">{r.index_startup?.name?.charAt(0)}</div>}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/startups/${r.index_startup?.slug}`} className="font-semibold hover:text-primary">{r.index_startup?.name}</Link>
                  <Badge variant="outline" className="text-[10px]">{(r.round_type || "").replace(/_/g, " ")}</Badge>
                  <BadgeCheck className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm mt-1">
                  Raised <span className="font-bold">${(r.amount_usd || 0).toLocaleString()}</span>
                  {r.announced_on && <span className="text-muted-foreground"> · {new Date(r.announced_on).toLocaleDateString()}</span>}
                </p>
                {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-bold">Top-ranked startups</h3>
          <ul className="space-y-2">
            {top.map((s) => (
              <li key={s.id}>
                <Link to={`/startups/${s.slug}`} className="flex items-center gap-2 rounded-lg border border-border p-2 hover:border-primary">
                  {s.logo_url ? <img src={s.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{s.name}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{Math.round(Number(s.sparkx_score) || 0)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link to="/ecosystem" className="block rounded-xl border border-primary/30 bg-primary/5 p-4 text-center hover:bg-primary/10">
          <div className="text-sm font-semibold text-primary">Open ecosystem dashboard →</div>
        </Link>
      </div>
    </div>
  );
};

/* ---------- Shared helpers ---------- */
const StatCard = ({ label, value, icon: Icon, hint }: { label: string; value: any; icon: any; hint?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <Icon className="h-4 w-4" /> {label}
    </div>
    <div className="mt-2 text-2xl font-bold">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
  </div>
);

/* ---------- Router ---------- */
const HomePage = () => {
  const { user, profile, primaryRole, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const partnerType = ((profile as any)?.partner_type || "").toLowerCase();
  const mediaTypes = new Set(["media", "university", "student"]);
  const gov = new Set(["government", "development_partner"]);
  const partnerRisers = new Set(["incubator", "corporate", "bank"]);

  let view: JSX.Element;
  let title = "Home";

  if (primaryRole === "startup_founder") {
    view = <FounderHome />; title = "Your dashboard";
  } else if (primaryRole === "investor") {
    view = <InvestorHome />; title = "Investor dashboard";
  } else if (primaryRole === "ecosystem_partner" && gov.has(partnerType)) {
    view = <EcosystemDashboard />; title = "Ecosystem dashboard";
  } else if (primaryRole === "ecosystem_partner" && partnerRisers.has(partnerType)) {
    view = <PartnerHome />; title = "Rising startups";
  } else if (primaryRole === "ecosystem_partner" && mediaTypes.has(partnerType)) {
    view = <MediaHome />; title = "Newsroom";
  } else if (primaryRole === "ecosystem_partner") {
    view = <EcosystemDashboard />; title = "Ecosystem dashboard";
  } else {
    view = <InvestorHome />; // sensible default: browse the ecosystem
    title = "Explore the ecosystem";
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/feed">Open Feed</Link></Button>
            <Button variant="outline" asChild><Link to="/startups">Browse Startups</Link></Button>
          </div>
        </div>
        <FeaturedStrip />
        {view}
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
