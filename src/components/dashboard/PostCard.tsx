import { useState } from "react";
import { Heart, MessageCircle, Share2, CheckCircle, MoreHorizontal, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PostWithDetails, Comment } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface PostCardProps {
  post: PostWithDetails;
  onToggleLike: (postId: string, isLiked: boolean) => Promise<void>;
  onFetchComments: (postId: string) => Promise<Comment[]>;
  onAddComment: (postId: string, content: string) => Promise<void>;
  onToggleFollow?: (userId: string) => Promise<void>;
  isFollowing?: boolean;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  announcement: "Announcement",
  success_story: "Success Story",
  funding: "Funding",
  event: "Event",
};

const PostCard = ({ post, onToggleLike, onFetchComments, onAddComment, onToggleFollow, isFollowing }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const initials = post.author_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false });
  const isOwnPost = user?.id === post.author_id;

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
    await onAddComment(post.id, newComment.trim());
    setNewComment("");
    const data = await onFetchComments(post.id);
    setComments(data);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Author header */}
      <div className="flex items-start justify-between p-5 pb-0">
        <div className="flex gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={post.author_avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{post.author_name}</span>
              {post.author_verification === "verified" && (
                <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.likes_count > 0 ? `${post.likes_count.toLocaleString()} followers` : "Member"}
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
          {!isOwnPost && onToggleFollow && (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={() => onToggleFollow(post.author_id)}
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
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.image_url && (
        <div>
          <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border px-3 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleLike(post.id, post.is_liked)}
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
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
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
