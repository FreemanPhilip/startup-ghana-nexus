import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Flame,
  Flag,
  Globe,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ClaimStartupDialog from "@/components/startups/ClaimStartupDialog";
import type { Database } from "@/integrations/supabase/types";

type IndexStartup = Database["public"]["Tables"]["index_startups"]["Row"];
type FundingRound = Database["public"]["Tables"]["index_funding_rounds"]["Row"];
type Investor = Database["public"]["Tables"]["index_investors"]["Row"];

interface RoundWithInvestors extends FundingRound {
  investors: { investor: Investor; is_lead: boolean }[];
}

interface PostRow {
  id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
}

const prettify = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const fmtUSD = (n: number | null) =>
  n == null ? "Undisclosed" : `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const StartupDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [startup, setStartup] = useState<IndexStartup | null>(null);
  const [rounds, setRounds] = useState<RoundWithInvestors[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followTargetUserId, setFollowTargetUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from("index_startups")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!s) { setStartup(null); setLoading(false); return; }
      setStartup(s);

      // Funding rounds + investors
      const { data: roundRows } = await supabase
        .from("index_funding_rounds")
        .select("*")
        .eq("index_startup_id", s.id)
        .order("announced_on", { ascending: false, nullsFirst: false });

      const roundIds = (roundRows ?? []).map(r => r.id);
      let riMap = new Map<string, { investor: Investor; is_lead: boolean }[]>();
      if (roundIds.length) {
        const { data: ri } = await supabase
          .from("index_round_investors")
          .select("round_id, is_lead, index_investor_id")
          .in("round_id", roundIds);
        const invIds = [...new Set((ri ?? []).map(r => r.index_investor_id))];
        const { data: invs } = invIds.length
          ? await supabase.from("index_investors").select("*").in("id", invIds)
          : { data: [] as Investor[] };
        const invMap = new Map((invs ?? []).map(i => [i.id, i]));
        (ri ?? []).forEach(r => {
          const inv = invMap.get(r.index_investor_id);
          if (!inv) return;
          const arr = riMap.get(r.round_id) ?? [];
          arr.push({ investor: inv, is_lead: r.is_lead ?? false });
          riMap.set(r.round_id, arr);
        });
      }
      setRounds((roundRows ?? []).map(r => ({ ...r, investors: riMap.get(r.id) ?? [] })));

      // Recent posts (only if claimed)
      let ownerUserId: string | null = null;
      if (s.claimed_by_startup_id) {
        const { data: memberStartup } = await supabase
          .from("startups")
          .select("created_by")
          .eq("id", s.claimed_by_startup_id)
          .maybeSingle();
        ownerUserId = memberStartup?.created_by ?? null;

        const { data: rawPosts } = await supabase
          .from("posts")
          .select("id, content, created_at, author_id")
          .eq("startup_id", s.claimed_by_startup_id)
          .order("created_at", { ascending: false })
          .limit(5);
        const authorIds = [...new Set((rawPosts ?? []).map(p => p.author_id))];
        const { data: profiles } = authorIds.length
          ? await supabase.from("public_profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds)
          : { data: [] as any[] };
        const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
        setPosts(
          (rawPosts ?? []).map(p => ({
            id: p.id,
            content: p.content,
            created_at: p.created_at,
            author_name: pMap.get(p.author_id)?.full_name ?? null,
            author_avatar: pMap.get(p.author_id)?.avatar_url ?? null,
          }))
        );

        // Follower count on the claimed startup's owner
        if (ownerUserId) {
          setFollowTargetUserId(ownerUserId);
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", ownerUserId);
          setFollowerCount(count ?? 0);
          if (user) {
            const { data: f } = await supabase
              .from("follows")
              .select("follower_id")
              .eq("follower_id", user.id)
              .eq("following_id", ownerUserId)
              .maybeSingle();
            setIsFollowing(!!f);
          }
        }
      }

      setLoading(false);
    })();
  }, [slug, user]);

  const toggleFollow = async () => {
    if (!user) { toast.error("Sign in to follow"); return; }
    if (!followTargetUserId) { toast.error("This startup hasn't been claimed yet"); return; }
    if (isFollowing) {
      setIsFollowing(false); setFollowerCount(c => Math.max(0, c - 1));
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", followTargetUserId);
    } else {
      setIsFollowing(true); setFollowerCount(c => c + 1);
      await supabase.from("follows").insert({ follower_id: user.id, following_id: followTargetUserId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-16">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-16 text-center">
          <h1 className="text-2xl font-bold">Startup not found</h1>
          <Link to="/startups" className="mt-4 inline-flex text-primary hover:underline">Back to directory</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = startup.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <Link to="/startups" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {startup.logo_url ? (
              <img src={startup.logo_url} alt={startup.name} className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">{startup.name}</h1>
                {startup.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
                {(startup as any).is_featured && (
                  <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/20 border-primary/30">
                    <Sparkles className="h-3 w-3" /> Featured
                  </Badge>
                )}
                {startup.is_raising && (
                  <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">
                    <Flame className="h-3 w-3" /> Raising
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {startup.sector && <Badge variant="secondary">{prettify(startup.sector)}</Badge>}
                {startup.stage && <Badge variant="outline">{prettify(startup.stage)}</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {(startup.city || startup.country) && (
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[startup.city, startup.country].filter(Boolean).join(", ")}</span>
                )}
                {startup.founded_year && (
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Founded {startup.founded_year}</span>
                )}
                {startup.team_size && (
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{startup.team_size} team</span>
                )}
                {startup.website_url && (
                  <a href={startup.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="h-4 w-4" />Website
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 md:items-end">
              {startup.sparkx_score != null && (
                <div className="rounded-lg border border-border bg-background px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-2xl font-bold leading-none">{Number(startup.sparkx_score).toFixed(0)}</span>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">SparkX Rank</div>
                </div>
              )}
              <Button
                onClick={toggleFollow}
                variant={isFollowing ? "outline" : "default"}
                disabled={!followTargetUserId}
                title={!followTargetUserId ? "This startup hasn't been claimed yet" : undefined}
              >
                {isFollowing ? "Following" : "Follow"} · {followerCount}
              </Button>
              {!startup.claimed_by_startup_id && (
                <Button variant="outline" onClick={() => setClaimOpen(true)} className="gap-1">
                  <Flag className="h-4 w-4" /> Claim this startup
                </Button>
              )}
            </div>
          </div>

          {startup.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">{startup.description}</p>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Funding history */}
          <section className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Funding History</h2>
            {rounds.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                No funding rounds recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.map(r => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <Badge variant="secondary">{prettify(r.round_type)}</Badge>
                        <span className="ml-3 text-lg font-semibold">{fmtUSD(r.amount_usd as any)}</span>
                      </div>
                      {r.announced_on && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(r.announced_on).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    {r.investors.length > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Investors</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.investors.map(({ investor, is_lead }) => (
                            <Badge key={investor.id} variant={is_lead ? "default" : "outline"}>
                              {investor.name}{is_lead && " · Lead"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.notes && <p className="mt-3 text-sm text-muted-foreground">{r.notes}</p>}
                    {r.source_url && (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                        Source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent posts */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Recent Updates</h2>
            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No recent posts.
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(p => (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      {p.author_avatar ? (
                        <img src={p.author_avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-muted" />
                      )}
                      <span className="text-sm font-medium">{p.author_name || "Member"}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-foreground/90">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupDetailPage;
