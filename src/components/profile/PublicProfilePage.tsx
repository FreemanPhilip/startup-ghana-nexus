import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Globe, Linkedin, Building2, CheckCircle, Shield, Award, Calendar, TrendingUp, Heart, MessageCircle, UserPlus, UserCheck, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useFollows } from "@/hooks/useFollows";
import { formatDistanceToNow } from "date-fns";

interface PublicProfilePageProps {
  userId: string;
  onBack: () => void;
  onMessage?: (userId: string) => void;
}

interface PublicProfile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  company_name: string | null;
  company_stage: string | null;
  industry: string | null;
  team_size: number | null;
  expertise: string[] | null;
  verification: string;
  membership: string;
  availability: string | null;
  created_at: string;
}

interface UserPost {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  category: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

const roleLabelMap: Record<string, string> = {
  startup_founder: "Founder",
  investor: "Investor",
  mentor: "Mentor",
  ecosystem_partner: "Partner",
  service_provider: "Service Provider",
  admin: "Admin",
  member: "Member",
};

const PublicProfilePage = ({ userId, onBack, onMessage }: PublicProfilePageProps) => {
  const { isFollowing, toggleFollow } = useFollows();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "posts">("about");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [profileRes, rolesRes, followersRes, followingRes, postsRes] = await Promise.all([
        supabase.from("public_profiles").select("user_id, full_name, headline, bio, avatar_url, location, website_url, linkedin_url, company_name, company_stage, industry, expertise, verification, availability, created_at").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("posts").select("*").eq("author_id", userId).order("created_at", { ascending: false }).limit(20),
      ]);

      setProfile(profileRes.data as PublicProfile | null);
      setRoles(rolesRes.data?.map(r => r.role) || ["member"]);
      setFollowStats({ followers: followersRes.count ?? 0, following: followingRes.count ?? 0 });

      if (postsRes.data && postsRes.data.length > 0) {
        const postIds = postsRes.data.map(p => p.id);
        const [likesRes, commentsRes] = await Promise.all([
          supabase.from("post_likes").select("post_id").in("post_id", postIds),
          supabase.from("post_comments").select("post_id").in("post_id", postIds),
        ]);
        const likeCounts = new Map<string, number>();
        likesRes.data?.forEach(l => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
        const commentCounts = new Map<string, number>();
        commentsRes.data?.forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));

        setPosts(postsRes.data.map(p => ({
          id: p.id,
          content: p.content,
          image_url: p.image_url,
          video_url: p.video_url,
          category: p.category,
          created_at: p.created_at,
          likes_count: likeCounts.get(p.id) ?? 0,
          comments_count: commentCounts.get(p.id) ?? 0,
        })));
      } else {
        setPosts([]);
      }
      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  const initials = profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const following = isFollowing(userId);
  const verificationLabel = profile.verification === "verified" ? "Verified" : profile.verification === "pending" ? "Pending" : "Unverified";

  const tabs = [
    { key: "about" as const, label: "About" },
    { key: "posts" as const, label: `Posts (${posts.length})` },
  ];

  return (
    <div className="space-y-0 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs mb-3" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Cover banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/70 via-primary to-primary/50 rounded-t-xl relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2ek0wIDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZTMy4zMTQgNiAwIDYtNiA4LjY4Ni02IDEycy4yNjg2IDYgNiA2ek0xOCAzNmMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 rounded-t-xl" />
      </div>

      {/* Profile header */}
      <div className="rounded-b-xl border border-t-0 border-border bg-card px-5 sm:px-8 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
          <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 sm:pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold">{profile.full_name || "Anonymous"}</h1>
                  {profile.verification === "verified" && (
                    <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    <Shield className="h-3 w-3 mr-1" />
                    {verificationLabel}
                  </Badge>
                  {profile.availability && (
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0 capitalize">
                      {profile.availability === "open" ? "Open to Connect" : profile.availability === "looking" ? "Actively Looking" : "Busy"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{profile.headline || "Ecosystem Member"}</p>
                {profile.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={following ? "outline" : "default"}
                  className="gap-1.5 text-xs font-semibold"
                  onClick={() => toggleFollow(userId)}
                >
                  {following ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Connect</>}
                </Button>
                {onMessage && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onMessage(userId)}>
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-3">
              {[
                { label: "Posts", value: posts.length },
                { label: "Followers", value: followStats.followers },
                { label: "Following", value: followStats.following },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-4 border-t border-border pt-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {activeTab === "about" && (
          <>
            <div className="flex-1 space-y-5">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio || "This user hasn't added a bio yet."}
                </p>
              </div>

              {(profile.company_name || profile.industry) && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Company
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {profile.company_name && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</p>
                        <p className="font-medium mt-0.5">{profile.company_name}</p>
                      </div>
                    )}
                    {profile.industry && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Industry</p>
                        <p className="font-medium mt-0.5">{profile.industry}</p>
                      </div>
                    )}
                    {profile.company_stage && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stage</p>
                        <p className="font-medium mt-0.5 capitalize">{profile.company_stage}</p>
                      </div>
                    )}
                    {profile.team_size && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team Size</p>
                        <p className="font-medium mt-0.5">{profile.team_size} people</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profile.expertise && profile.expertise.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map(e => (
                      <Badge key={e} className="text-[10px] bg-primary/10 text-primary border-0">{e}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="lg:w-64 shrink-0 space-y-5">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">Links</h3>
                <div className="space-y-3">
                  {profile.website_url && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{profile.website_url}</a>
                    </div>
                  )}
                  {profile.linkedin_url && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Linkedin className="h-3.5 w-3.5 shrink-0" />
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">LinkedIn</a>
                    </div>
                  )}
                  {!profile.website_url && !profile.linkedin_url && (
                    <p className="text-xs text-muted-foreground">No links shared.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {roles.map(r => (
                    <Badge key={r} variant="outline" className="text-[10px] capitalize">{roleLabelMap[r] || r}</Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">Member Since</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "posts" && (
          <div className="flex-1 space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{post.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  {post.image_url && <img src={post.image_url} alt="Post" className="w-full max-h-64 object-cover rounded-lg" />}
                  {post.video_url && <video src={post.video_url} controls className="w-full max-h-64 rounded-lg" />}
                  <div className="flex items-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.likes_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comments_count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
