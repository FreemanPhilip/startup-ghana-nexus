import { useState } from "react";
import { Heart, MessageCircle, CheckCircle, MoreHorizontal, Globe, Building2, Rocket, TrendingUp, GraduationCap, Handshake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PostWithDetails, Comment } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import PostContentRenderer from "./PostContentRenderer";
import ImageCarousel from "./ImageCarousel";
import ShareMenu from "./ShareMenu";

const roleConfig: Record<string, { label: string; className: string; icon: any }> = {
  startup_founder: { label: "Founder", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Rocket },
  investor: { label: "Investor", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: TrendingUp },
  mentor: { label: "Mentor", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: GraduationCap },
  ecosystem_partner: { label: "Partner", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Handshake },
};

const RoleBadge = ({ role }: { role: string }) => {
  const config = roleConfig[role];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${config.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
};

interface PostCardProps {
  post: PostWithDetails;
  onToggleLike: (vars: { postId: string; isLiked: boolean }) => Promise<void> | void;
  onFetchComments: (postId: string) => Promise<Comment[]>;
  onAddComment: (vars: { postId: string; content: string }) => Promise<void> | void;
  onToggleFollow?: (userId: string) => Promise<void> | void;
  isFollowing?: boolean;
  onViewStartup?: (startupId: string) => void;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  announcement: "Announcement",
  success_story: "Success Story",
  funding: "Funding",
  event: "Event",
  article: "Article",
};

const PostCard = ({ post, onToggleLike, onFetchComments, onAddComment, onToggleFollow, isFollowing, onViewStartup }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const isStartupPost = !!(post as any).startup_id;
  const startupId = (post as any).startup_id as string | undefined;
  const startupName = (post as any).startup_name as string | undefined;
  const startupLogo = (post as any).startup_logo as string | undefined;

  const displayName = isStartupPost && startupName ? startupName : post.author_name;
  const displayAvatar = isStartupPost && startupLogo ? startupLogo : post.author_avatar;
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false });
  const isOwnPost = user?.id === post.author_id;

  // Article parsing
  const isArticle = post.category === "article";
  let articleTitle = "";
  let contentBody = post.content;
  if (isArticle && post.content.startsWith("# ")) {
    const lines = post.content.split("\n");
    articleTitle = lines[0].replace(/^#\s*/, "");
    contentBody = lines.slice(1).join("\n").trim();
  }

  // Collect all images
  const allImages: string[] = [
    ...(post.image_urls || []),
    ...(!post.image_urls?.length && post.image_url ? [post.image_url] : []),
  ].filter(Boolean) as string[];

  const handleToggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const data = await onFetchComments(post.id);
      setComments(data);
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await onAddComment({ postId: post.id, content: newComment.trim() });
    setNewComment("");
    const data = await onFetchComments(post.id);
    setComments(data);
  };

  const handleAuthorClick = () => {
    if (isStartupPost && startupId && onViewStartup) {
      onViewStartup(startupId);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Author header */}
      <div className="flex items-start justify-between p-5 pb-0">
        <div className="flex gap-3">
          <Avatar
            className={`h-11 w-11 ${isStartupPost && onViewStartup ? "cursor-pointer" : ""} ${isStartupPost ? "rounded-lg" : ""}`}
            onClick={handleAuthorClick}
          >
            <AvatarImage src={displayAvatar || undefined} />
            <AvatarFallback className={`bg-primary/10 text-xs font-bold text-primary ${isStartupPost ? "rounded-lg" : ""}`}>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-sm font-semibold ${isStartupPost && onViewStartup ? "cursor-pointer hover:underline" : ""}`}
                onClick={handleAuthorClick}
              >
                {displayName}
              </span>
              {isStartupPost && (
                <Badge variant="secondary" className="text-[10px] gap-0.5 h-4 px-1.5">
                  <Building2 className="h-2.5 w-2.5" /> Company
                </Badge>
              )}
              {!isStartupPost && (post as any).author_role && (
                <RoleBadge role={(post as any).author_role} />
              )}
              {!isStartupPost && post.author_verification === "verified" && (
                <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isStartupPost ? "Company Page" : post.likes_count > 0 ? `${post.likes_count.toLocaleString()} followers` : "Member"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              <span>·</span>
              <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.category !== "general" && (
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[post.category] || post.category}
            </Badge>
          )}
          {!isOwnPost && !isStartupPost && onToggleFollow && (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={() => onToggleFollow?.(post.author_id)}
              className={!isFollowing ? "bg-gradient-gold text-navy font-semibold hover:opacity-90 h-7 text-xs" : "h-7 text-xs"}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-3">
        {isArticle && articleTitle && (
          <h3 className="text-lg font-bold mb-2">{articleTitle}</h3>
        )}
        <PostContentRenderer
          content={contentBody}
          maxLines={isArticle ? 4 : 3}
        />
      </div>

      {/* Images carousel */}
      {allImages.length > 0 && (
        <ImageCarousel images={allImages} />
      )}

      {/* Video */}
      {post.video_url && (
        <div>
          <video src={post.video_url} controls className="w-full max-h-96" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border px-3 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleLike({ postId: post.id, isLiked: post.is_liked })}
          className={`gap-1.5 text-xs ${post.is_liked ? "text-destructive" : "text-muted-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`} />
          {post.likes_count > 0 && post.likes_count}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleComments}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments_count > 0 && post.comments_count}
        </Button>
        <ShareMenu postId={post.id} postContent={post.content} authorName={displayName} />
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground">Loading comments...</p>
          ) : (
            <>
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={c.author_avatar || undefined} />
                    <AvatarFallback className="text-[10px] font-bold bg-muted">
                      {c.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg bg-card p-2.5">
                    <p className="text-xs font-semibold">{c.author_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">No comments yet. Be the first!</p>
              )}
            </>
          )}
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="h-8 bg-gradient-gold text-navy font-semibold hover:opacity-90 text-xs"
            >
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
