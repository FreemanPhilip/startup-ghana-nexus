import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PostWithDetails {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
  video_url: string | null;
  category: string;
  created_at: string;
  author_name: string;
  author_headline: string | null;
  author_avatar: string | null;
  author_verification: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

export function usePosts(category?: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: postsData } = await query;
    if (!postsData) { setPosts([]); setLoading(false); return; }

    const authorIds = [...new Set(postsData.map(p => p.author_id))];
    const postIds = postsData.map(p => p.id);

    const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("public_profiles").select("user_id, full_name, headline, avatar_url, verification").in("user_id", authorIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
      user ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const likeCounts = new Map<string, number>();
    likesRes.data?.forEach(l => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
    const commentCounts = new Map<string, number>();
    commentsRes.data?.forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));
    const userLikedSet = new Set(userLikesRes.data?.map(l => l.post_id) ?? []);

    const enriched: PostWithDetails[] = postsData.map(p => {
      const profile = profileMap.get(p.author_id);
      return {
        id: p.id,
        author_id: p.author_id,
        content: p.content,
        image_url: p.image_url,
        image_urls: (p as any).image_urls ?? [],
        video_url: (p as any).video_url ?? null,
        category: p.category,
        created_at: p.created_at,
        author_name: profile?.full_name || "Anonymous",
        author_headline: profile?.headline ?? null,
        author_avatar: profile?.avatar_url ?? null,
        author_verification: profile?.verification || "unverified",
        likes_count: likeCounts.get(p.id) ?? 0,
        comments_count: commentCounts.get(p.id) ?? 0,
        is_liked: userLikedSet.has(p.id),
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user, category]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = async (content: string, category: string = "general", imageUrl?: string, videoUrl?: string, startupId?: string, imageUrls?: string[]) => {
    if (!user) return;
    await supabase.from("posts").insert({
      author_id: user.id,
      content,
      category,
      image_url: imageUrl ?? null,
      image_urls: imageUrls ?? [],
      video_url: videoUrl ?? null,
      startup_id: startupId ?? null,
    } as any);
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) }
        : p
    ));
  };

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    const { data: comments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!comments) return [];
    const authorIds = [...new Set(comments.map(c => c.author_id))];
    const { data: profiles } = await supabase.from("public_profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    return comments.map(c => ({
      id: c.id,
      post_id: c.post_id,
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
      author_name: profileMap.get(c.author_id)?.full_name || "Anonymous",
      author_avatar: profileMap.get(c.author_id)?.avatar_url ?? null,
    }));
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    await supabase.from("post_comments").insert({ post_id: postId, author_id: user.id, content });
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
    ));
  };

  return { posts, loading, createPost, toggleLike, fetchComments, addComment, refetch: fetchPosts };
}
