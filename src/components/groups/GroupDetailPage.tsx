import { useState } from "react";
import { ArrowLeft, Users, Lock, Send, Heart, MessageCircle, Loader2, Globe, Calendar, Shield, MoreHorizontal, UserMinus, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGroupDetail } from "@/hooks/useGroups";
import { useGroupAdmin } from "@/hooks/useGroupAdmin";
import { useGroupEvents } from "@/hooks/useGroupEvents";
import InviteMembersDialog from "./InviteMembersDialog";
import JoinRequestsPanel from "./JoinRequestsPanel";
import CreateEventDialog from "./CreateEventDialog";
import GroupEventsTab from "./GroupEventsTab";
import GroupFilesTab from "./GroupFilesTab";
import GroupCreatePostCard from "./GroupCreatePostCard";
import { formatDistanceToNow } from "date-fns";

interface GroupDetailPageProps {
  groupId: string;
  onBack: () => void;
}

const GroupDetailPage = ({ groupId, onBack }: GroupDetailPageProps) => {
  const { group, posts, members, loading, createPost, toggleLike, addComment, refetch } = useGroupDetail(groupId);
  const admin = useGroupAdmin(groupId);
  const eventsHook = useGroupEvents(groupId);
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "members" | "events" | "files" | "requests">("feed");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const handlePost = async (content: string, imageUrl?: string, videoUrl?: string) => {
    setPosting(true);
    await createPost(content, imageUrl, videoUrl);
    setPosting(false);
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    await addComment(postId, content);
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  const handleRequestToJoin = async () => {
    await admin.requestToJoin();
  };

  if (loading || !group) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const gradient = group.cover_color || "from-blue-600 to-indigo-700";
  const isAdmin = group.my_role === "admin";
  const tabs = [
    { key: "feed" as const, label: "Feed" },
    { key: "members" as const, label: "Members" },
    { key: "events" as const, label: "Events" },
    { key: "files" as const, label: "Files" },
    ...(isAdmin && group.is_private ? [{ key: "requests" as const, label: `Requests (${admin.joinRequests.length})` }] : []),
  ];

  return (
    <div className="space-y-0">
      {/* Cover banner */}
      <div className={`h-28 sm:h-36 bg-gradient-to-br ${gradient} relative rounded-t-xl`}>
        <Button variant="ghost" size="icon" className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm hover:bg-card" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Group header */}
      <div className="rounded-b-xl border border-t-0 border-border bg-card px-4 sm:px-6 pb-4">
        {/* Icon overlapping banner */}
        <div className="-mt-10 mb-3">
          <div className={`h-20 w-20 rounded-xl ${(group as any).icon_url ? '' : `bg-gradient-to-br ${gradient}`} border-4 border-card flex items-center justify-center shadow-md overflow-hidden`}>
            {(group as any).icon_url ? (
              <img src={(group as any).icon_url} alt={group.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold font-display">{group.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-bold">{group.name}</h1>
              <Badge variant="outline" className="text-[10px] gap-1">
                {group.is_private ? <><Lock className="h-3 w-3" /> Private</> : <><Globe className="h-3 w-3" /> Public</>}
              </Badge>
              {group.is_member && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Member</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {group.member_count.toLocaleString()} Members · {(group as any).category && (group as any).category !== "general" ? `${(group as any).category} · ` : ""}{group.description || "No description"}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            {group.is_member ? (
              <>
                {isAdmin && (
                  <InviteMembersDialog
                    groupId={groupId}
                    existingMemberIds={members.map(m => m.user_id)}
                    onInvite={admin.inviteUser}
                  />
                )}
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => setActiveTab("feed")}>
                  <Send className="h-3.5 w-3.5" /> Post Update
                </Button>
              </>
            ) : group.is_private ? (
              <Button size="sm" className="gap-1.5 text-xs" onClick={handleRequestToJoin}>
                <Lock className="h-3.5 w-3.5" /> Request to Join
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => {}}>Join Group</Button>
            )}
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

      {/* Content area - 3 column layout */}
      <div className="flex flex-col lg:flex-row gap-5 mt-5">
        {/* Left sidebar - About */}
        <div className="lg:w-60 shrink-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display font-bold text-sm mb-2">About Group</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{group.description || "No description provided."}</p>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                <span>{group.is_private ? "Private group" : "Visible to everyone"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {new Date(group.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Admin team */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display font-bold text-sm mb-3">Admin Team</h3>
            <div className="space-y-2">
              {members.filter(m => m.role === "admin").map(m => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-[10px]">{(m.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{m.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">{m.headline || "Admin"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Feed / Members / Requests */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeTab === "feed" && (
            <>
              {/* Create Post */}
              {group.is_member && (
                <GroupCreatePostCard onSubmit={handlePost} />
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
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{post.author_name}</p>
                            <p className="text-[10px] text-muted-foreground">{post.author_headline} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url} alt="Post image" className="w-full max-h-96 object-cover rounded-lg" />
                    )}
                    {(post as any).video_url && (
                      <video src={(post as any).video_url} controls className="w-full max-h-96 rounded-lg" />
                    )}
                    <div className="flex items-center gap-4 pt-2 border-t border-border">
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
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.user_id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-xs">{(m.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{m.full_name || "Unknown"}</p>
                      {m.role === "admin" && (
                        <Badge variant="outline" className="text-[10px] gap-0.5"><Shield className="h-3 w-3" /> Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.headline || "Member"}</p>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.role === "member" ? (
                          <DropdownMenuItem onClick={() => admin.updateMemberRole("", m.user_id, "admin")}>
                            <ChevronUp className="h-3.5 w-3.5 mr-2" /> Promote to Admin
                          </DropdownMenuItem>
                        ) : m.role === "admin" && (
                          <DropdownMenuItem onClick={() => admin.updateMemberRole("", m.user_id, "member")}>
                            <ChevronUp className="h-3.5 w-3.5 mr-2 rotate-180" /> Demote to Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => admin.removeMember(m.user_id)}>
                          <UserMinus className="h-3.5 w-3.5 mr-2" /> Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-4">
              {isAdmin && (
                <div className="flex justify-end">
                  <CreateEventDialog onCreate={eventsHook.createEvent} />
                </div>
              )}
              <GroupEventsTab
                events={eventsHook.events}
                loading={eventsHook.loading}
                isMember={group.is_member}
                isAdmin={isAdmin}
                onRsvp={eventsHook.toggleRsvp}
                onDelete={eventsHook.deleteEvent}
              />
            </div>
          )}

          {activeTab === "files" && (
            <GroupFilesTab groupId={groupId} isMember={group.is_member} isAdmin={isAdmin} />
          )}

          {activeTab === "requests" && isAdmin && (
            <JoinRequestsPanel
              requests={admin.joinRequests}
              loading={admin.loading}
              onApprove={async (reqId, userId) => { await admin.approveRequest(reqId, userId); refetch(); }}
              onReject={admin.rejectRequest}
            />
          )}
        </div>

        {/* Right sidebar - Members preview */}
        <div className="hidden lg:block w-56 shrink-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Members ({group.member_count})
            </h3>
            <div className="space-y-2.5">
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

          {/* Upcoming Events widget */}
          {eventsHook.events.filter(e => new Date(e.event_date) >= new Date()).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display font-bold text-sm mb-3">Upcoming Events</h3>
              <div className="space-y-3">
                {eventsHook.events
                  .filter(e => new Date(e.event_date) >= new Date())
                  .slice(0, 3)
                  .map(e => {
                    const d = new Date(e.event_date);
                    return (
                      <div key={e.id} className="flex gap-2.5">
                        <div className="flex flex-col items-center rounded bg-primary/10 text-primary w-10 h-10 shrink-0 justify-center">
                          <span className="text-[8px] font-bold uppercase leading-none">{d.toLocaleDateString("en", { month: "short" })}</span>
                          <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{e.title}</p>
                          <p className="text-[10px] text-muted-foreground">{d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })} · {e.is_virtual ? "Virtual" : e.location || "TBD"}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <button onClick={() => setActiveTab("events")} className="text-xs text-primary font-medium mt-3 hover:underline">View Calendar</button>
            </div>
          )}

          {/* Quick stats */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display font-bold text-sm mb-3">Activity</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Posts today</span>
                <span className="font-semibold text-foreground">{group.post_count_today}</span>
              </div>
              <div className="flex justify-between">
                <span>Total posts</span>
                <span className="font-semibold text-foreground">{posts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Members</span>
                <span className="font-semibold text-foreground">{group.member_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
