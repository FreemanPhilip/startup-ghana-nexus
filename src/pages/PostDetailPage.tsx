import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import SparkXLogo from "@/components/SparkXLogo";
import PostContentRenderer from "@/components/dashboard/PostContentRenderer";
import ImageCarousel from "@/components/dashboard/ImageCarousel";
import { formatDistanceToNow } from "date-fns";
import { LANDING_PATH } from "@/lib/roleRouting";

interface PublicPost {
  id: string;
  author_id: string;
  category: string;
  content: string;
  created_at: string;
  image_url: string | null;
  image_urls: string[] | null;
  video_url: string | null;
  author: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  announcement: "Announcement",
  success_story: "Success Story",
  funding: "Funding",
  event: "Event",
  article: "Article",
};

const POST_SELECT =
  "id, author_id, category, content, created_at, image_url, image_urls, video_url, author:public_profiles!posts_author_id_fkey(full_name, avatar_url)";

async function fetchPost(postId: string): Promise<PublicPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as PublicPost;
}

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PublicPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setError("No post found by that link.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const data = await fetchPost(postId);
      if (cancelled) return;
      if (!data) {
        setError("That post could not be found.");
      } else {
        setPost(data);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [postId]);

  // An author editing or deleting the post should be reflected for whoever is
  // reading it. Filtered to this post so the page is not woken by every post
  // on the platform.
  useRealtimeSubscription(
    { table: "posts", filter: postId ? `id=eq.${postId}` : undefined },
    () => {
      void (async () => {
        const data = await fetchPost(postId!);
        // A deleted post should say so rather than leaving stale content up.
        if (!data) {
          setPost(null);
          setError("That post is no longer available.");
          return;
        }
        setPost(data);
      })();
    },
    !!postId,
  );

  const allImages: string[] = [
    ...(post?.image_urls || []),
    ...(!post?.image_urls?.length && post?.image_url ? [post.image_url] : []),
  ].filter(Boolean) as string[];

  const authorName = post?.author?.full_name || "Member";
  const initials = authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 md:px-6">
          <Link to={LANDING_PATH} aria-label="SparkX home" className="flex items-center">
            <SparkXLogo className="h-7" />
          </Link>
          <Link to="/sparkx-index">
            <Button variant="outline" size="sm">
              View all posts
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-12 text-center"
          >
            <h1 className="font-display text-xl font-bold">{error}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The link may have expired or the post was removed.
            </p>
            <Link to="/sparkx-index">
              <Button className="mt-6 bg-gradient-brand font-semibold text-white hover:opacity-90">
                Explore the community
              </Button>
            </Link>
          </motion.div>
        )}

        {post && !loading && (
          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-start justify-between p-5 pb-0">
              <div className="flex gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{authorName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                  </p>
                </div>
              </div>
              {post.category !== "general" && (
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[post.category] || post.category}
                </Badge>
              )}
            </div>

            <div className="px-5 py-3">
              <PostContentRenderer content={post.content} maxLines={20} />
            </div>

            {allImages.length > 0 && <ImageCarousel images={allImages} />}

            {post.video_url && (
              <video src={post.video_url} controls className="w-full max-h-96" />
            )}
          </motion.article>
        )}
      </main>
    </div>
  );
};

export default PostDetailPage;