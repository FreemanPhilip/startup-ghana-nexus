import { useState } from "react";
import { ArrowLeft, Users, Lock, Send, Heart, MessageCircle, Loader2, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGroupDetail } from "@/hooks/useGroups";
import { formatDistanceToNow } from "date-fns";

interface GroupDetailPageProps {
  groupId: string;
  onBack: () => void;
}

const GroupDetailPage = ({ groupId, onBack }: GroupDetailPageProps) => {
  const { group, posts, members, loading, createPost, toggleLike, addComment } = useGroupDetail(groupId);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "members" | "about">("posts");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    await createPost(newPost.trim());
    setNewPost("");
    setPosting(false);
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    await addComment(postId, content);
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  if (loading || !group) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const gradient = group.cover_color || "from-blue-600 to-indigo-700";

  return (
    <div className="space-y-6">
      {/* Cover & Header */}
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <div className={`h-32 sm:h-40 bg-gradient-to-br ${gradient} relative`}>
          <Button variant="ghost" size="icon" className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm hover:bg-card" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">{group.name}</h1>
                {group.is_private && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{group.description || "No description"}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.member_count} members</span>
                <span>{group.post_count_today} posts today</span>
              </div>
            </div>
            <div className="flex gap-2">
              {group.is_member ? (
                <>
                  {group.my_role === "admin" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" /> Settings</Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                    <LogOut className="h-3.5 w-3.5" /> Leave
                  </Button>
                </>
              ) : (
                <Button size="sm" className="gap-1.5 text-xs">Join Group</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {(["posts", "members", "about"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab} {tab === "members" && `(${group.member_count})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {activeTab === "posts" && (
            <>
              {/* Create Post */}
              {group.is_member && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <Textarea
                    placeholder="Share something with the group..."
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="gap-1.5" onClick={handlePost} disabled={!newPost.trim() || posting}>
                      <Send className="h-3.5 w-3.5" /> {posting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback className="bg-muted text-xs">{(post.author_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{post.author_name}</p>
                        <p className="text-[10px] text-muted-foreground">{post.author_headline} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-4 pt-1 border-t border-border">
                      <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-xs transition-colors ${post.is_liked ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}>
                        <Heart className={`h-3.5 w-3.5 ${post.is_liked ? "fill-current" : ""}`} /> {post.like_count}
                      </button>
                      <button onClick={() => setExpandedComments(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <MessageCircle className="h-3.5 w-3.5" /> {post.comment_count}
                      </button>
                    </div>
                    {expandedComments.has(post.id) && group.is_member && (
                      <div className="flex gap-2 pt-2">
                        <input
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleComment(post.id)}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleComment(post.id)}><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "members" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map(m => (
                <div key={m.user_id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-xs">{(m.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{m.full_name || "Unknown"}</p>
                      {m.role === "admin" && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">Admin</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.headline || "Member"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "about" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div>
                <h3 className="font-display font-bold text-sm mb-1">About this group</h3>
                <p className="text-sm text-muted-foreground">{group.description || "No description provided."}</p>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm mb-1">Group Type</h3>
                <p className="text-sm text-muted-foreground">{group.is_private ? "Private — Members must be approved" : "Public — Anyone can join"}</p>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm mb-1">Created</h3>
                <p className="text-sm text-muted-foreground">{new Date(group.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Members preview */}
        <div className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display font-bold text-sm mb-3">Members ({group.member_count})</h3>
            <div className="space-y-2">
              {members.slice(0, 8).map(m => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-[10px]">{(m.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{m.full_name || "Unknown"}</p>
                    {m.role === "admin" && <p className="text-[10px] text-primary">Admin</p>}
                  </div>
                </div>
              ))}
            </div>
            {members.length > 8 && (
              <button onClick={() => setActiveTab("members")} className="text-xs text-primary font-medium mt-3 hover:underline">
                View all members
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
