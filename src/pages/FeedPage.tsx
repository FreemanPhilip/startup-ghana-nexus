import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Send, Sparkles, BadgeCheck, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStartups } from "@/hooks/useStartups";
import { toast } from "sonner";

type PostType = "update" | "funding_announcement" | "milestone" | "hiring";

interface PostRow {
  id: string;
  content: string;
  post_type: PostType;
  created_at: string;
  author_id: string;
  startup_id: string | null;
  author?: { full_name: string | null; avatar_url: string | null } | null;
  author_role?: string | null;
  startup?: { name: string; slug: string | null; logo_url: string | null } | null;
  likes: number;
  comments: number;
  liked_by_me: boolean;
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "update", label: "Update" },
  { value: "milestone", label: "Milestone" },
  { value: "hiring", label: "Hiring" },
  { value: "funding_announcement", label: "Funding announcement" },
];

const ROUND_TYPES = ["pre_seed", "seed", "series_a", "series_b", "series_c", "bridge", "grant", "debt", "growth", "other"] as const;

const roleColor: Record<string, string> = {
  startup_founder: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  investor: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  mentor: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  ecosystem_partner: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  admin: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

const FeedPage = () => {
  const { user, profile } = useAuth();
  const { myStartups } = useStartups();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("update");
  const [startupId, setStartupId] = useState<string>("");
  const [amountUsd, setAmountUsd] = useState("");
  const [roundType, setRoundType] = useState<string>("seed");
  const [announcedOn, setAnnouncedOn] = useState<string>(new Date().toISOString().slice(0, 10));
  const [investorNames, setInvestorNames] = useState("");
  const [busy, setBusy] = useState(false);

  const eligibleStartups = useMemo(
    () => myStartups.filter((s) => ["owner", "admin", "editor"].includes(s.my_role)),
    [myStartups]
  );

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("posts")
      .select("id, content, post_type, created_at, author_id, startup_id")
      .order("created_at", { ascending: false })
      .limit(40);

    const rows = (data || []) as any[];
    const authorIds = [...new Set(rows.map((r) => r.author_id))];
    const startupIds = [...new Set(rows.map((r) => r.startup_id).filter(Boolean))];
    const postIds = rows.map((r) => r.id);

    const [profRes, roleRes, stRes, likeRes, comRes, myLikesRes] = await Promise.all([
      authorIds.length ? supabase.from("public_profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds) : Promise.resolve({ data: [] as any[] }),
      authorIds.length ? supabase.from("user_roles").select("user_id, role").in("user_id", authorIds) : Promise.resolve({ data: [] as any[] }),
      startupIds.length ? supabase.from("startups").select("id, name, slug, logo_url").in("id", startupIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("post_likes").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("post_comments").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
      user && postIds.length ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
    ]);

    const pMap = new Map((profRes.data as any[] || []).map((p: any) => [p.user_id, p]));
    const rMap = new Map((roleRes.data as any[] || []).map((r: any) => [r.user_id, r.role]));
    const sMap = new Map((stRes.data as any[] || []).map((s: any) => [s.id, s]));
    const likeCounts = new Map<string, number>();
    (likeRes.data as any[] || []).forEach((l: any) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1));
    const commentCounts = new Map<string, number>();
    (comRes.data as any[] || []).forEach((c: any) => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1));
    const myLikeSet = new Set((myLikesRes.data as any[] || []).map((l: any) => l.post_id));

    setPosts(
      rows.map((r) => ({
        id: r.id,
        content: r.content,
        post_type: (r.post_type as PostType) || "update",
        created_at: r.created_at,
        author_id: r.author_id,
        startup_id: r.startup_id,
        author: pMap.get(r.author_id) || null,
        author_role: rMap.get(r.author_id) || null,
        startup: r.startup_id ? sMap.get(r.startup_id) : null,
        likes: likeCounts.get(r.id) || 0,
        comments: commentCounts.get(r.id) || 0,
        liked_by_me: myLikeSet.has(r.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const submit = async () => {
    if (!user) { toast.error("Sign in to post"); return; }
    if (!content.trim()) { toast.error("Write something"); return; }
    if (postType === "funding_announcement") {
      if (!startupId) { toast.error("Pick which startup this round is for"); return; }
      if (!amountUsd || isNaN(Number(amountUsd))) { toast.error("Enter round amount in USD"); return; }
    }
    setBusy(true);
    try {
      // 1. Insert post
      const { data: newPost, error: pErr } = await (supabase as any).from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        post_type: postType,
        startup_id: startupId || null,
        category: postType === "funding_announcement" ? "funding" : "general",
      }).select("id").single();
      if (pErr) throw pErr;

      // 2. If funding, create index_funding_rounds row (unverified)
      if (postType === "funding_announcement" && startupId) {
        // Find the claimed index_startup for this member startup, if any
        const { data: idx } = await (supabase as any)
          .from("index_startups")
          .select("id")
          .eq("claimed_by_startup_id", startupId)
          .maybeSingle();

        if (idx?.id) {
          const { data: round, error: rErr } = await (supabase as any).from("index_funding_rounds").insert({
            index_startup_id: idx.id,
            round_type: roundType,
            amount_usd: Number(amountUsd),
            announced_on: announcedOn,
            verified: false,
            source_post_id: newPost.id,
            notes: investorNames ? `Investors mentioned: ${investorNames}` : null,
          }).select("id").single();
          if (rErr) throw rErr;

          // 3. Match investor names against index_investors and link
          if (round?.id && investorNames.trim()) {
            const names = investorNames.split(",").map((n) => n.trim()).filter(Boolean);
            if (names.length) {
              const { data: found } = await (supabase as any)
                .from("index_investors")
                .select("id, name")
                .in("name", names);
              const rows = (found || []).map((inv: any) => ({
                round_id: round.id,
                index_investor_id: inv.id,
                is_lead: false,
              }));
              if (rows.length) await (supabase as any).from("index_round_investors").insert(rows);
            }
          }
        } else {
          toast.info("Round saved on the post. Claim your startup in The Index to attach it there.");
        }
      }

      toast.success("Posted!");
      setContent(""); setAmountUsd(""); setInvestorNames("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async (p: PostRow) => {
    if (!user) return;
    if (p.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: p.id, user_id: user.id });
    }
    setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, liked_by_me: !p.liked_by_me, likes: x.likes + (p.liked_by_me ? -1 : 1) } : x));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <h1 className="mb-4 text-2xl font-bold">Feed</h1>

        {/* Composer */}
        {user && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9"><AvatarImage src={profile?.avatar_url || undefined} /><AvatarFallback>{(profile?.full_name || "U").charAt(0)}</AvatarFallback></Avatar>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{POST_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={startupId || "none"} onValueChange={(v) => setStartupId(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Post as (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Post as myself</SelectItem>
                    {eligibleStartups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share an update…" />
            {postType === "funding_announcement" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <DollarSign className="h-4 w-4" /> Funding announcement
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (USD)</Label>
                    <Input type="number" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} placeholder="500000" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Round</Label>
                    <Select value={roundType} onValueChange={setRoundType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROUND_TYPES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Announced on</Label>
                    <Input type="date" value={announcedOn} onChange={(e) => setAnnouncedOn(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Investors (comma-separated)</Label>
                    <Input value={investorNames} onChange={(e) => setInvestorNames(e.target.value)} placeholder="Acme VC, Angel A" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Rounds go into a moderation queue and appear as unverified until our team confirms them.</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={submit} disabled={busy}><Send className="h-4 w-4 mr-1" /> Post</Button>
            </div>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="text-muted-foreground">Loading feed…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No posts yet. Be the first!</div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarImage src={p.author?.avatar_url || undefined} /><AvatarFallback>{(p.author?.full_name || "U").charAt(0)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-sm">{p.author?.full_name || "Member"}</span>
                      {p.author_role && (
                        <Badge variant="outline" className={`text-[10px] ${roleColor[p.author_role] || ""}`}>
                          {p.author_role.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {p.post_type === "funding_announcement" && (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30">Funding</Badge>
                      )}
                      {p.post_type === "milestone" && (
                        <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Milestone</Badge>
                      )}
                      {p.post_type === "hiring" && (
                        <Badge className="text-[10px] bg-blue-500/15 text-blue-600 border-blue-500/30">Hiring</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm">{p.content}</p>
                {p.startup && (
                  <Link to={p.startup.slug ? `/startups/${p.startup.slug}` : "#"} className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 hover:bg-muted transition-colors">
                    {p.startup.logo_url ? (
                      <img src={p.startup.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">{p.startup.name.charAt(0)}</div>
                    )}
                    <div className="text-sm font-semibold">{p.startup.name}</div>
                  </Link>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <button onClick={() => toggleLike(p)} className={`flex items-center gap-1 hover:text-primary ${p.liked_by_me ? "text-primary" : ""}`}>
                    <Heart className={`h-4 w-4 ${p.liked_by_me ? "fill-current" : ""}`} /> {p.likes}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary">
                    <MessageCircle className="h-4 w-4" /> {p.comments}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FeedPage;
