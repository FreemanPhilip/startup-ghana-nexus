import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, MapPin, Globe, Linkedin, Phone, Mail, Briefcase, Users, Building2, Edit3, Save, X, Loader2, Heart, MessageCircle, CheckCircle, Calendar, Award, TrendingUp, LogOut, Shield, Clock } from "lucide-react";
import MentorAvailabilityManager from "@/components/mentorship/MentorAvailabilityManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ProfilePageProps {
  onSignOut: () => void;
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

const ProfilePage = ({ onSignOut }: ProfilePageProps) => {
  const { user, profile, roles, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "about" | "settings" | "availability">("about");
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    phone: "",
    website_url: "",
    linkedin_url: "",
    company_name: "",
    company_stage: "",
    industry: "",
    team_size: "",
    expertise: [] as string[],
    availability: "",
    booking_url: "",
  });

  const resetForm = useCallback(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        phone: profile.phone || "",
        website_url: profile.website_url || "",
        linkedin_url: profile.linkedin_url || "",
        company_name: profile.company_name || "",
        company_stage: profile.company_stage || "",
        industry: profile.industry || "",
        team_size: profile.team_size?.toString() || "",
        expertise: profile.expertise || [],
        availability: profile.availability || "",
        booking_url: (profile as any).booking_url || "",
      });
    }
  }, [profile]);

  useEffect(() => { resetForm(); }, [resetForm]);

  // Fetch user posts
  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (postsData && postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        const [likesRes, commentsRes] = await Promise.all([
          supabase.from("post_likes").select("post_id").in("post_id", postIds),
          supabase.from("post_comments").select("post_id").in("post_id", postIds),
        ]);
        const likeCounts = new Map<string, number>();
        likesRes.data?.forEach(l => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
        const commentCounts = new Map<string, number>();
        commentsRes.data?.forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));

        setPosts(postsData.map(p => ({
          id: p.id,
          content: p.content,
          image_url: p.image_url,
          video_url: (p as any).video_url ?? null,
          category: p.category,
          created_at: p.created_at,
          likes_count: likeCounts.get(p.id) ?? 0,
          comments_count: commentCounts.get(p.id) ?? 0,
        })));
      } else {
        setPosts([]);
      }
      setPostsLoading(false);
    };
    fetchPosts();
  }, [user]);

  // Fetch follow stats
  useEffect(() => {
    if (!user) return;
    const fetchFollows = async () => {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      setFollowStats({
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      });
    };
    fetchFollows();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("post-media").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
      await refreshProfile();
      toast({ title: "Avatar updated!" });
    } else {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim() || null,
      headline: form.headline.trim() || null,
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
      phone: form.phone.trim() || null,
      website_url: form.website_url.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      company_name: form.company_name.trim() || null,
      company_stage: form.company_stage || null,
      industry: form.industry.trim() || null,
      team_size: form.team_size ? parseInt(form.team_size) : null,
      expertise: form.expertise.length > 0 ? form.expertise : null,
      availability: form.availability || null,
      booking_url: form.booking_url.trim() || null,
    }).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast({ title: "Post deleted" });
  };

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const verificationLabel = profile?.verification === "verified" ? "Verified" : profile?.verification === "pending" ? "Pending" : "Unverified";

  const isMentor = roles.includes("mentor");
  const tabs = [
    { key: "about" as const, label: "About" },
    { key: "posts" as const, label: `Posts (${posts.length})` },
    ...(isMentor ? [{ key: "availability" as const, label: "Availability" }] : []),
    { key: "settings" as const, label: "Settings" },
  ];

  return (
    <div className="space-y-0 max-w-4xl mx-auto">
      {/* Cover banner */}
      <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/70 via-primary to-primary/50 rounded-t-xl relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2ek0wIDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZTMy4zMTQgNiAwIDYtNiA4LjY4Ni02IDEycy4yNjg2IDYgNiA2ek0xOCAzNmMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 rounded-t-xl" />
      </div>

      {/* Profile header card */}
      <div className="rounded-b-xl border border-t-0 border-border bg-card px-5 sm:px-8 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
          {/* Avatar with upload */}
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div className="flex-1 sm:pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold">{profile?.full_name || "Your Name"}</h1>
                  {profile?.verification === "verified" && (
                    <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    <Shield className="h-3 w-3 mr-1" />
                    {verificationLabel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{profile?.headline || "Add a headline"}</p>
                {profile?.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setEditing(false); resetForm(); }}>
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
                    <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Stats row */}
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
              {editing ? (
                /* Edit form */
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h3 className="font-display font-bold text-sm">Edit Profile Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input placeholder="e.g. Founder & CEO at TechCo" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input placeholder="Accra, Ghana" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input placeholder="+233..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input placeholder="https://..." value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>LinkedIn</Label>
                      <Input placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Booking URL (Calendly, Cal.com, etc.)</Label>
                      <Input placeholder="https://calendly.com/your-link" value={form.booking_url} onChange={e => setForm(f => ({ ...f, booking_url: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input placeholder="e.g. FinTech" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Stage</Label>
                      <Select value={form.company_stage} onValueChange={v => setForm(f => ({ ...f, company_stage: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea Stage</SelectItem>
                          <SelectItem value="mvp">MVP</SelectItem>
                          <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="series-a">Series A</SelectItem>
                          <SelectItem value="series-b">Series B+</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Team Size</Label>
                      <Input type="number" min="1" value={form.team_size} onChange={e => setForm(f => ({ ...f, team_size: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open to Connect</SelectItem>
                          <SelectItem value="busy">Currently Busy</SelectItem>
                          <SelectItem value="looking">Actively Looking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea placeholder="Tell us about yourself and your venture..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expertise (comma-separated)</Label>
                    <Input
                      placeholder="e.g. Product Strategy, Fundraising, Marketing"
                      value={form.expertise.join(", ")}
                      onChange={e => setForm(f => ({ ...f, expertise: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                    />
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="font-display font-bold text-sm mb-3">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile?.bio || "No bio added yet. Click 'Edit Profile' to add one."}
                    </p>
                  </div>

                  {(profile?.company_name || profile?.industry) && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> Company
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {profile?.company_name && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</p>
                            <p className="font-medium mt-0.5">{profile.company_name}</p>
                          </div>
                        )}
                        {profile?.industry && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Industry</p>
                            <p className="font-medium mt-0.5">{profile.industry}</p>
                          </div>
                        )}
                        {profile?.company_stage && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stage</p>
                            <p className="font-medium mt-0.5 capitalize">{profile.company_stage}</p>
                          </div>
                        )}
                        {profile?.team_size && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team Size</p>
                            <p className="font-medium mt-0.5">{profile.team_size} people</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {profile?.expertise && profile.expertise.length > 0 && (
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
                </>
              )}
            </div>

            {/* Right sidebar - contact & roles */}
            <div className="lg:w-64 shrink-0 space-y-5">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">Contact</h3>
                <div className="space-y-3">
                  {user?.email && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.website_url && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{profile.website_url}</a>
                    </div>
                  )}
                  {profile?.linkedin_url && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Linkedin className="h-3.5 w-3.5 shrink-0" />
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">LinkedIn</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {roles.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No roles assigned</p>
                  ) : (
                    roles.map(r => (
                      <Badge key={r} variant="outline" className="text-[10px] capitalize">{r.replace("_", " ")}</Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-sm mb-3">Member Since</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{profile ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Membership: <span className="capitalize font-medium text-foreground">{profile?.membership || "standard"}</span></span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "posts" && (
          <div className="flex-1 space-y-4">
            {postsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">No posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your posts from the ecosystem feed will appear here.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{post.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDeletePost(post.id)}>
                      Delete
                    </Button>
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

        {activeTab === "availability" && isMentor && (
          <div className="flex-1">
            <MentorAvailabilityManager />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 space-y-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-sm mb-2">Account</h3>
              <p className="text-xs text-muted-foreground mb-4">Manage your account settings and preferences.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Verification Status</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.verification || "unverified"}</p>
                  </div>
                  {profile?.verification === "unverified" && (
                    <Button size="sm" variant="outline" className="text-xs">Request Verification</Button>
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Membership</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.membership || "standard"}</p>
                  </div>
                  {profile?.membership !== "premium" && (
                    <Button size="sm" className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">Upgrade</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-card p-5">
              <h3 className="font-display font-bold text-sm mb-2 text-destructive">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mb-4">These actions are irreversible. Proceed with caution.</p>
              <Button variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5" onClick={onSignOut}>
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
