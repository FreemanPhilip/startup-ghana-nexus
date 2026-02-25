import { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import CreatePostCard from "./CreatePostCard";
import PostCard from "./PostCard";
import GroupPostFeedCard from "./GroupPostFeedCard";
import OpportunityFeedCard from "./OpportunityFeedCard";
import RecommendedConnections from "./RecommendedConnections";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { usePosts } from "@/hooks/usePosts";
import { useFollows } from "@/hooks/useFollows";

const tabs = [
  { id: "all", label: "All" },
  { id: "posts", label: "Posts" },
  { id: "groups", label: "Groups" },
  { id: "opportunities", label: "Opportunities" },
];

const EcosystemFeed = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { items, loading } = useHomeFeed();
  const { createPost, toggleLike, fetchComments, addComment } = usePosts();
  const { toggleFollow, isFollowing } = useFollows();

  const filtered = activeTab === "all"
    ? items
    : items.filter(item => {
        if (activeTab === "posts") return item.type === "post";
        if (activeTab === "groups") return item.type === "group_post";
        if (activeTab === "opportunities") return item.type === "opportunity";
        return true;
      });

  // Insert recommended connections card after 2nd item
  const showConnectionsAt = 2;

  return (
    <div className="space-y-5">
      {/* Create post */}
      <CreatePostCard onSubmit={createPost} />

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to share an update!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, index) => (
            <div key={item.id}>
              {/* Insert recommended connections after 2nd item */}
              {index === showConnectionsAt && <RecommendedConnections />}

              {item.type === "post" && (
                <PostCard
                  post={{
                    id: item.id,
                    author_id: item.author_id!,
                    content: item.content!,
                    image_url: item.image_url ?? null,
                    category: item.category || "general",
                    created_at: item.created_at,
                    author_name: item.author_name || "Anonymous",
                    author_headline: item.author_headline ?? null,
                    author_avatar: item.author_avatar ?? null,
                    author_verification: item.author_verification || "unverified",
                    likes_count: item.likes_count || 0,
                    comments_count: item.comments_count || 0,
                    is_liked: item.is_liked || false,
                  }}
                  onToggleLike={toggleLike}
                  onFetchComments={fetchComments}
                  onAddComment={addComment}
                  onToggleFollow={toggleFollow}
                  isFollowing={isFollowing(item.author_id!)}
                />
              )}

              {item.type === "group_post" && (
                <GroupPostFeedCard item={item} />
              )}

              {item.type === "opportunity" && (
                <OpportunityFeedCard item={item} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EcosystemFeed;
