import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeedItem {
  id: string;
  type: "post" | "group_post" | "opportunity";
  created_at: string;
  // Post fields
  author_id?: string;
  content?: string;
  image_url?: string | null;
  video_url?: string | null;
  category?: string;
  author_name?: string;
  author_headline?: string | null;
  author_avatar?: string | null;
  author_verification?: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  // Startup identity fields
  startup_id?: string | null;
  startup_name?: string | null;
  startup_logo?: string | null;
  // Group post fields
  group_id?: string;
  group_name?: string;
  group_cover_color?: string;
  // Opportunity fields
  title?: string;
  description?: string;
  organization?: string;
  organization_logo?: string | null;
  opp_type?: string;
  amount?: string | null;
  deadline?: string | null;
  tags?: string[] | null;
}

export function useHomeFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    setLoading(true);

    // Fetch regular posts, group posts from user's groups, and recent opportunities in parallel
    const myGroupIdsPromise = user
      ? supabase.from("group_members").select("group_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] });

    const [postsRes, myGroupsRes, oppsRes] = await Promise.all([
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
      myGroupIdsPromise,
      supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

    const myGroupIds = (myGroupsRes.data || []).map((g: any) => g.group_id);

    // Fetch group posts from user's groups
    let groupPostsData: any[] = [];
    let groupsMap = new Map<string, { name: string; cover_color: string | null }>();
    if (myGroupIds.length > 0) {
      const [gpRes, groupsRes] = await Promise.all([
        supabase.from("group_posts").select("*").in("group_id", myGroupIds).order("created_at", { ascending: false }).limit(10),
        supabase.from("groups").select("id, name, cover_color").in("id", myGroupIds),
      ]);
      groupPostsData = gpRes.data || [];
      groupsRes.data?.forEach(g => groupsMap.set(g.id, { name: g.name, cover_color: g.cover_color }));
    }

    // Collect startup IDs for lookup
    const startupIds = new Set<string>();
    postsRes.data?.forEach(p => { if ((p as any).startup_id) startupIds.add((p as any).startup_id); });
    const startupIdsArr = [...startupIds];

    // Collect all author IDs for profile lookup
    const allAuthorIds = new Set<string>();
    postsRes.data?.forEach(p => allAuthorIds.add(p.author_id));
    groupPostsData.forEach(p => allAuthorIds.add(p.author_id));
    const authorIdsArr = [...allAuthorIds];

    // Fetch profiles and like/comment counts
    const postIds = (postsRes.data || []).map(p => p.id);
    const gpIds = groupPostsData.map(p => p.id);

    const [profilesRes, startupsRes, likesRes, commentsRes, userLikesRes, gpLikesRes, gpCommentsRes, gpUserLikesRes] = await Promise.all([
      authorIdsArr.length > 0 ? supabase.from("profiles").select("user_id, full_name, headline, avatar_url, verification").in("user_id", authorIdsArr) : Promise.resolve({ data: [] }),
      startupIdsArr.length > 0 ? supabase.from("startups").select("id, name, logo_url").in("id", startupIdsArr) : Promise.resolve({ data: [] }),
      postIds.length > 0 ? supabase.from("post_likes").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
      postIds.length > 0 ? supabase.from("post_comments").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
      user && postIds.length > 0 ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
      gpIds.length > 0 ? supabase.from("group_post_likes").select("post_id").in("post_id", gpIds) : Promise.resolve({ data: [] }),
      gpIds.length > 0 ? supabase.from("group_post_comments").select("post_id").in("post_id", gpIds) : Promise.resolve({ data: [] }),
      user && gpIds.length > 0 ? supabase.from("group_post_likes").select("post_id").eq("user_id", user.id).in("post_id", gpIds) : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const startupMap = new Map((startupsRes.data || []).map((s: any) => [s.id, s]));

    // Count maps for regular posts
    const likeCounts = new Map<string, number>();
    (likesRes.data || []).forEach((l: any) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1));
    const commentCounts = new Map<string, number>();
    (commentsRes.data || []).forEach((c: any) => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1));
    const userLikedSet = new Set((userLikesRes.data || []).map((l: any) => l.post_id));

    // Count maps for group posts
    const gpLikeCounts = new Map<string, number>();
    (gpLikesRes.data || []).forEach((l: any) => gpLikeCounts.set(l.post_id, (gpLikeCounts.get(l.post_id) || 0) + 1));
    const gpCommentCounts = new Map<string, number>();
    (gpCommentsRes.data || []).forEach((c: any) => gpCommentCounts.set(c.post_id, (gpCommentCounts.get(c.post_id) || 0) + 1));
    const gpUserLikedSet = new Set((gpUserLikesRes.data || []).map((l: any) => l.post_id));

    const feedItems: FeedItem[] = [];

    // Regular posts
    (postsRes.data || []).forEach(p => {
      const profile = profileMap.get(p.author_id);
      const sId = (p as any).startup_id;
      const startup = sId ? startupMap.get(sId) : null;
      feedItems.push({
        id: p.id,
        type: "post",
        created_at: p.created_at,
        author_id: p.author_id,
        content: p.content,
        image_url: p.image_url,
        video_url: (p as any).video_url ?? null,
        category: p.category,
        author_name: profile?.full_name || "Anonymous",
        author_headline: profile?.headline ?? null,
        author_avatar: profile?.avatar_url ?? null,
        author_verification: profile?.verification || "unverified",
        likes_count: likeCounts.get(p.id) ?? 0,
        comments_count: commentCounts.get(p.id) ?? 0,
        is_liked: userLikedSet.has(p.id),
        startup_id: sId ?? null,
        startup_name: startup?.name ?? null,
        startup_logo: startup?.logo_url ?? null,
      });
    });

    // Group posts
    groupPostsData.forEach(p => {
      const profile = profileMap.get(p.author_id);
      const grp = groupsMap.get(p.group_id);
      feedItems.push({
        id: `gp-${p.id}`,
        type: "group_post",
        created_at: p.created_at,
        author_id: p.author_id,
        content: p.content,
        image_url: p.image_url,
        author_name: profile?.full_name || "Anonymous",
        author_headline: profile?.headline ?? null,
        author_avatar: profile?.avatar_url ?? null,
        author_verification: profile?.verification || "unverified",
        likes_count: gpLikeCounts.get(p.id) ?? 0,
        comments_count: gpCommentCounts.get(p.id) ?? 0,
        is_liked: gpUserLikedSet.has(p.id),
        group_id: p.group_id,
        group_name: grp?.name || "Group",
        group_cover_color: grp?.cover_color || "from-blue-600 to-indigo-700",
      });
    });

    // Opportunities (sprinkle in as feed items)
    (oppsRes.data || []).forEach(o => {
      feedItems.push({
        id: `opp-${o.id}`,
        type: "opportunity",
        created_at: o.created_at,
        title: o.title,
        description: o.description,
        organization: o.organization,
        organization_logo: o.organization_logo,
        opp_type: o.type,
        amount: o.amount,
        deadline: o.deadline,
        tags: o.tags,
      });
    });

    // Sort by created_at descending
    feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setItems(feedItems);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  useEffect(() => {
    const channel = supabase
      .channel("home-feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => fetchFeed())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_posts" }, () => fetchFeed())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFeed]);

  return { items, loading, refetch: fetchFeed };
}
