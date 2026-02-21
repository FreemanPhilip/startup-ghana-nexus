import { useState } from "react";
import { Rss, Loader2 } from "lucide-react";
import CreatePostCard from "./CreatePostCard";
import PostCard from "./PostCard";
import { usePosts } from "@/hooks/usePosts";
import { useFollows } from "@/hooks/useFollows";

const tabs = [
  { id: "all", label: "All" },
  { id: "announcement", label: "Announcements" },
  { id: "success_story", label: "Success Stories" },
  { id: "funding", label: "Funding" },
  { id: "event", label: "Events" },
];

const EcosystemFeed = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { posts, loading, createPost, toggleLike, fetchComments, addComment } = usePosts(activeTab);
  const { toggleFollow, isFollowing } = useFollows();

  return (
    <div className="space-y-6">
      {/* Section header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Ecosystem Feed</h2>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Create post */}
      <CreatePostCard onSubmit={createPost} />

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Rss className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Be the first to share an update!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={toggleLike}
              onFetchComments={fetchComments}
              onAddComment={addComment}
              onToggleFollow={toggleFollow}
              isFollowing={isFollowing(post.author_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EcosystemFeed;
