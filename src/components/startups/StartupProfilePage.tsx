import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Building2, Globe, MapPin, Users, ExternalLink, ShieldCheck, ShieldAlert, Shield, Calendar, Linkedin, FileText, CheckCircle2, Loader2, Settings, Pencil, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/dashboard/PostCard";
import StartupTeamManagement from "./StartupTeamManagement";
import StartupAnalytics from "./StartupAnalytics";
import EditStartupDialog from "./EditStartupDialog";
import type { PostWithDetails, Comment } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";

interface StartupProfilePageProps {
  startupId: string;
  onBack: () => void;
}

interface StartupDetail {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  industry: string | null;
  stage: string | null;
  location: string | null;
  short_description: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  registration_doc_url: string | null;
  verification_status: string;
  created_by: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  confirmed: boolean;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
}

const verificationBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <Badge className="bg-primary/10 text-primary gap-1 border-0"><ShieldCheck className="h-3 w-3" /> Verified Startup</Badge>;
    case "premium_verified":
      return <Badge className="bg-gradient-gold text-navy gap-1 border-0"><ShieldCheck className="h-3 w-3" /> Premium Verified</Badge>;
    default:
      return <Badge variant="secondary" className="gap-1"><ShieldAlert className="h-3 w-3" /> Pending Verification</Badge>;
  }
};

const roleBadgeColor = (role: string) => {
  switch (role) {
    case "owner": return "bg-primary/10 text-primary border-0";
    case "admin": return "bg-secondary/10 text-secondary border-0";
    case "editor": return "bg-accent/10 text-accent-foreground border-0";
    default: return "";
  }
};

const StartupProfilePage = ({ startupId, onBack }: StartupProfilePageProps) => {
  const { user } = useAuth();
  const [startup, setStartup] = useState<StartupDetail | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [showEditDialog, setShowEditDialog] = useState(false);

  const fetchTeam = useCallback(async () => {
    const { data: members } = await supabase
      .from("startup_members")
      .select("id, user_id, role, confirmed, startup_id")
      .eq("startup_id", startupId);

    if (members?.length) {
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, headline").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
      setTeam(members.map(m => ({ ...m, profile: profileMap.get(m.user_id) ?? null })));
    } else {
      setTeam([]);
    }
  }, [startupId]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const { data: s } = await supabase.from("startups").select("*").eq("id", startupId).single();
      setStartup(s);

      await fetchTeam();

      // Fetch startup posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("startup_id", startupId)
        .order("created_at", { ascending: false });

      if (postsData?.length) {
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const postIds = postsData.map(p => p.id);
        const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, headline, avatar_url, verification").in("user_id", authorIds),
          supabase.from("post_likes").select("post_id").in("post_id", postIds),
          supabase.from("post_comments").select("post_id").in("post_id", postIds),
          user ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
        ]);
        const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
        const likeCounts = new Map<string, number>();
        likesRes.data?.forEach(l => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
        const commentCounts = new Map<string, number>();
        commentsRes.data?.forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));
        const userLikedSet = new Set(userLikesRes.data?.map(l => l.post_id) ?? []);

        setPosts(postsData.map(p => {
          const profile = profileMap.get(p.author_id);
          return {
            id: p.id, author_id: p.author_id, content: p.content,
            image_url: p.image_url, video_url: (p as any).video_url ?? null,
            category: p.category, created_at: p.created_at,
            author_name: (s?.name ?? profile?.full_name) ?? "Anonymous",
            author_headline: profile?.headline ?? null,
            author_avatar: (s?.logo_url ?? profile?.avatar_url) ?? null,
            author_verification: (profile?.verification ?? "unverified"),
            likes_count: likeCounts.get(p.id) ?? 0,
            comments_count: commentCounts.get(p.id) ?? 0,
            is_liked: userLikedSet.has(p.id),
          };
        }));
      }

      setLoading(false);
    };
    fetchAll();
  }, [startupId, user, fetchTeam]);

  const handleToggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p));
  };

  const handleFetchComments = async (postId: string): Promise<Comment[]> => {
    const { data: comments } = await supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (!comments) return [];
    const authorIds = [...new Set(comments.map(c => c.author_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    return comments.map(c => ({
      id: c.id, post_id: c.post_id, author_id: c.author_id, content: c.content, created_at: c.created_at,
      author_name: profileMap.get(c.author_id)?.full_name || "Anonymous",
      author_avatar: profileMap.get(c.author_id)?.avatar_url ?? null,
    }));
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user) return;
    await supabase.from("post_comments").insert({ post_id: postId, author_id: user.id, content });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Startup not found.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const confirmedTeam = team.filter(m => m.confirmed);
  const teamVerified = confirmedTeam.length >= 2;
  const myMembership = team.find(m => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "owner" || myMembership?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/80 via-primary to-primary/60 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2ek0wIDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZTMy4zMTQgNiAwIDYtNiA4LjY4Ni02IDEycy4yNjg2IDYgNiA2ek0xOCAzNmMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <Button variant="ghost" size="icon" className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm hover:bg-card" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-card border border-t-0 border-border px-5 sm:px-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <Avatar className="h-20 w-20 rounded-xl border-4 border-card shadow-lg">
              <AvatarImage src={startup.logo_url || undefined} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">
                {startup.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-xl font-bold">{startup.name}</h1>
                    {verificationBadge(startup.verification_status)}
                    {teamVerified && (
                      <Badge className="bg-secondary/10 text-secondary gap-1 border-0">
                        <CheckCircle2 className="h-3 w-3" /> Team Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[startup.industry, startup.stage, startup.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowEditDialog(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  {startup.website_url && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                      <a href={startup.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3.5 w-3.5" /> Website
                      </a>
                    </Button>
                  )}
                  {startup.linkedin_url && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                      <a href={startup.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-card border border-border rounded-xl h-10">
          <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
          <TabsTrigger value="team" className="text-xs">Team ({confirmedTeam.length})</TabsTrigger>
          <TabsTrigger value="posts" className="text-xs">Posts ({posts.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="analytics" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> Analytics</TabsTrigger>}
          {isAdmin && <TabsTrigger value="manage" className="text-xs gap-1"><Settings className="h-3 w-3" /> Manage</TabsTrigger>}
        </TabsList>

        <TabsContent value="about" className="mt-4 space-y-5">
          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> About
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {startup.short_description || "No description provided yet."}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-display font-bold text-sm">Details</h3>
              <div className="space-y-2.5">
                {startup.industry && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{startup.industry}</span>
                  </div>
                )}
                {startup.stage && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{startup.stage}</span>
                  </div>
                )}
                {startup.location && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{startup.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Founded {formatDistanceToNow(new Date(startup.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-display font-bold text-sm">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-foreground">{confirmedTeam.length}</p>
                  <p className="text-[10px] text-muted-foreground">Team Members</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-foreground">{posts.length}</p>
                  <p className="text-[10px] text-muted-foreground">Posts</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Team Members
            </h3>
            {confirmedTeam.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No confirmed team members yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {confirmedTeam.map(m => {
                  const initials = m.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={m.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{m.profile?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.profile?.headline || ""}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${roleBadgeColor(m.role)}`}>
                        {m.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">No posts yet from this startup.</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={handleToggleLike}
                onFetchComments={handleFetchComments}
                onAddComment={handleAddComment}
              />
            ))
          )}
        </TabsContent>
        {isAdmin && (
          <TabsContent value="analytics" className="mt-4">
            <StartupAnalytics startupId={startupId} />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="manage" className="mt-4">
            <StartupTeamManagement
              startupId={startupId}
              team={team}
              onTeamUpdated={fetchTeam}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      {isAdmin && startup && (
        <EditStartupDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          startup={startup}
          onUpdated={() => {
            // Re-fetch startup data
            supabase.from("startups").select("*").eq("id", startupId).single().then(({ data }) => {
              if (data) setStartup(data);
            });
          }}
        />
      )}
    </div>
  );
};

export default StartupProfilePage;
