import { supabase } from "@/integrations/supabase/client";
import { getProfilesByIds } from "./profiles";

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
  startup_id?: string | null;
  startup_name?: string | null;
  startup_logo?: string | null;
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

export async function fetchPostsEnriched(category?: string, userId?: string): Promise<PostWithDetails[]> {
  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data: postsData } = await query;
  if (!postsData) return [];

  const authorIds = [...new Set(postsData.map(p => p.author_id))];
  const postIds = postsData.map(p => p.id);

  const [profilesMap, likesRes, commentsRes, userLikesRes] = await Promise.all([
    getProfilesByIds(authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    supabase.from("post_comments").select("post_id").in("post_id", postIds),
    userId
      ? supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  const likeCounts = new Map<string, number>();
  likesRes.data?.forEach(l => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
  const commentCounts = new Map<string, number>();
  commentsRes.data?.forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1));
  const userLikedSet = new Set(userLikesRes.data?.map(l => l.post_id) ?? []);

  return postsData.map(p => {
    const profile = profilesMap.get(p.author_id);
    return {
      id: p.id,
      author_id: p.author_id,
      content: p.content,
      image_url: p.image_url,
      image_urls: (p as Record<string, unknown>).image_urls as string[] ?? [],
      video_url: (p as Record<string, unknown>).video_url as string | null ?? null,
      category: p.category,
      created_at: p.created_at,
      author_name: profile?.full_name || "Anonymous",
      author_headline: profile?.headline ?? null,
      author_avatar: profile?.avatar_url ?? null,
      author_verification: profile?.verification || "unverified",
      likes_count: likeCounts.get(p.id) ?? 0,
      comments_count: commentCounts.get(p.id) ?? 0,
      is_liked: userLikedSet.has(p.id),
      startup_id: (p as Record<string, unknown>).startup_id as string | null ?? null,
    };
  });
}

export async function fetchPostComments(postId: string): Promise<Comment[]> {
  const { data: comments } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (!comments) return [];

  const authorIds = [...new Set(comments.map(c => c.author_id))];
  const profilesMap = await getProfilesByIds(authorIds);

  return comments.map(c => ({
    id: c.id,
    post_id: c.post_id,
    author_id: c.author_id,
    content: c.content,
    created_at: c.created_at,
    author_name: profilesMap.get(c.author_id)?.full_name || "Anonymous",
    author_avatar: profilesMap.get(c.author_id)?.avatar_url ?? null,
  }));
}

export async function insertPost(input: {
  author_id: string;
  content: string;
  category?: string;
  image_url?: string | null;
  image_urls?: string[];
  video_url?: string | null;
  startup_id?: string | null;
}) {
  return supabase.from("posts").insert({
    author_id: input.author_id,
    content: input.content,
    category: input.category ?? "general",
    image_url: input.image_url ?? null,
    image_urls: input.image_urls ?? [],
    video_url: input.video_url ?? null,
    startup_id: input.startup_id ?? null,
  });
}

export async function insertPostLike(postId: string, userId: string) {
  return supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
}

export async function deletePostLike(postId: string, userId: string) {
  return supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
}

export async function insertPostComment(postId: string, authorId: string, content: string) {
  return supabase.from("post_comments").insert({ post_id: postId, author_id: authorId, content });
}
