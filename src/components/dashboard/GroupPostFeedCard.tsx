import { Heart, MessageCircle, Share2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FeedItem } from "@/hooks/useHomeFeed";
import { formatDistanceToNow } from "date-fns";
import PostContentRenderer from "./PostContentRenderer";
import ImageCarousel from "./ImageCarousel";

interface GroupPostFeedCardProps {
  item: FeedItem;
  onToggleLike?: (postId: string) => void;
  onViewGroup?: (groupId: string) => void;
}

const GroupPostFeedCard = ({ item, onToggleLike, onViewGroup }: GroupPostFeedCardProps) => {
  const initials = (item.author_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: false });

  const allImages: string[] = [
    ...((item as any).image_urls || []),
    ...(!((item as any).image_urls?.length) && item.image_url ? [item.image_url] : []),
  ].filter(Boolean) as string[];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Group badge header */}
      <button
        onClick={() => item.group_id && onViewGroup?.(item.group_id)}
        className="flex items-center gap-2 px-5 pt-3 pb-1 w-full text-left hover:bg-muted/50 transition-colors"
      >
        <div className={`h-6 w-6 rounded bg-gradient-to-br ${item.group_cover_color || "from-blue-600 to-indigo-700"} flex items-center justify-center`}>
          <Users className="h-3 w-3 text-white" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          Posted in <span className="text-foreground hover:underline">{item.group_name}</span>
        </span>
      </button>

      {/* Author */}
      <div className="flex items-start gap-3 px-5 pt-2 pb-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.author_avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{item.author_name}</p>
          <p className="text-xs text-muted-foreground">{item.author_headline} · {timeAgo}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-3">
        <PostContentRenderer content={item.content || ""} maxLines={3} />
      </div>

      {allImages.length > 0 && (
        <ImageCarousel images={allImages} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border px-3 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 text-xs ${item.is_liked ? "text-destructive" : "text-muted-foreground"}`}
          onClick={() => onToggleLike?.(item.id.replace("gp-", ""))}
        >
          <Heart className={`h-4 w-4 ${item.is_liked ? "fill-current" : ""}`} />
          {(item.likes_count || 0) > 0 && item.likes_count}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          {(item.comments_count || 0) > 0 && item.comments_count}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
};

export default GroupPostFeedCard;
