import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getProfilesByIds, getProfilesWithRoles } from "@/lib/supabase/queries/profiles";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { queryClient } from "@/lib/queryClient";

export interface FeedItem {
  id: string;
  type: "post" | "group_post" | "opportunity";
  created_at: string;
  author_id?: string;
  content?: string;
  image_url?: string | null;
  image_urls?: string[];
  video_url?: string | null;
  category?: string;
  author_name?: string;
  author_headline?: string | null;
  author_avatar?: string | null;
  author_verification?: string;
  author_role?: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  startup_id?: string | null;
  startup_name?: string | null;
  startup_logo?: string | null;
  group_id?: string;
  group_name?: string;
  group_cover_color?: string;
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

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["homeFeed", user?.id],
    queryFn: async (): Promise<FeedItem[]> => {
      const myGroupIdsPromise = user
        ? supabase.from("group_members").select("group_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] });

      const [postsRes, myGroupsRes, oppsRes] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
        myGroupIdsPromise,
        supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const myGroupIds = (myGroupsRes.data || []).map((g) => g.group_id);

      let groupPostsData: Record<string, unknown>[] = [];
      let groupsMap = new Map<string, { name: string; cover_color: string | null }>();
      if (myGroupIds.length > 0) {
        const [gpRes, groupsRes] = await Promise.all([
          supabase.from("group_posts").select("*").in("group_id", myGroupIds).order("created_at", { ascending: false }).limit(10),
          supabase.from("groups").select("id, name, cover_color").in("id", myGroupIds),
        ]);
        groupPostsData = gpRes.data || [];
        groupsRes.data?.forEach(g => groupsMap.set(g.id, { name: g.name, cover_color: g.cover_color }));
      }

      const startupIds = new Set<string>();
      postsRes.data?.forEach(p => { const sId = (p as Record<string, unknown>).startup_id; if (sId) startupIds.add(sId as string); });
      const startupIdsArr = [...startupIds];

      const allAuthorIds = new Set<string>();
      postsRes.data?.forEach(p => allAuthorIds.add(p.author_id));
      groupPostsData.forEach(p => allAuthorIds.add(p.author_id as string));
      const authorIdsArr = [...allAuthorIds];

      const postIds = (postsRes.data || []).map(p => p.id);
      const gpIds = groupPostsData.map(p => p.id as string);

      const [profilesMap, roleMap, likesRes, commentsRes, userLikesRes, gpLikesRes, gpCommentsRes, gpUserLikesRes, startupsRes] = await Promise.all([
        getProfilesWithRoles(authorIdsArr).then(r => r.profiles),
        getProfilesWithRoles(authorIdsArr).then(r => r.roles),
        postIds.length > 0 ? supabase.from("post_likes").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
        postIds.length > 0 ? supabase.from("post_comments").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
        user && postIds.length > 0 ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
        gpIds.length > 0 ? supabase.from("group_post_likes").select("post_id").in("post_id", gpIds) : Promise.resolve({ data: [] }),
        gpIds.length > 0 ? supabase.from("group_post_comments").select("post_id").in("post_id", gpIds) : Promise.resolve({ data: [] }),
        user && gpIds.length > 0 ? supabase.from("group_post_likes").select("post_id").eq("user_id", user.id).in("post_id", gpIds) : Promise.resolve({ data: [] }),
        startupIdsArr.length > 0 ? supabase.from("startups").select("id, name, logo_url").in("id", startupIdsArr) : Promise.resolve({ data: [] }),
      ]);

      const startupMap = new Map((startupsRes.data || []).map((s) => [s.id, s]));
      const likeCounts = new Map<string, number>();
      likesRes.data?.forEach(l => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1));
      const commentCounts = new Map<string, number>();
      commentsRes.data?.forEach(c => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1));
      const userLikedSet = new Set(userLikesRes.data?.map(l => l.post_id) ?? []);
      const gpLikeCounts = new Map<string, number>();
      gpLikesRes.data?.forEach(l => gpLikeCounts.set(l.post_id, (gpLikeCounts.get(l.post_id) || 0) + 1));
      const gpCommentCounts = new Map<string, number>();
      gpCommentsRes.data?.forEach(c => gpCommentCounts.set(c.post_id, (gpCommentCounts.get(c.post_id) || 0) + 1));
      const gpUserLikedSet = new Set(gpUserLikesRes.data?.map(l => l.post_id) ?? []);

      const feedItems: FeedItem[] = [];

      (postsRes.data || []).forEach(p => {
        const profile = profilesMap.get(p.author_id);
        const sId = (p as Record<string, unknown>).startup_id as string | null;
        const startup = sId ? startupMap.get(sId) : null;
        feedItems.push({
          id: p.id,
          type: "post",
          created_at: p.created_at,
          author_id: p.author_id,
          content: p.content,
          image_url: p.image_url,
          image_urls: (p as Record<string, unknown>).image_urls as string[] ?? [],
          video_url: (p as Record<string, unknown>).video_url as string | null ?? null,
          category: p.category,
          author_name: profile?.full_name || "Anonymous",
          author_headline: profile?.headline ?? null,
          author_avatar: profile?.avatar_url ?? null,
          author_verification: profile?.verification || "unverified",
          author_role: roleMap.get(p.author_id) ?? null,
          likes_count: likeCounts.get(p.id) ?? 0,
          comments_count: commentCounts.get(p.id) ?? 0,
          is_liked: userLikedSet.has(p.id),
          startup_id: sId ?? null,
          startup_name: startup?.name ?? null,
          startup_logo: startup?.logo_url ?? null,
        });
      });

      groupPostsData.forEach(p => {
        const authorId = p.author_id as string;
        const profile = profilesMap.get(authorId);
        const grp = groupsMap.get(p.group_id as string);
        feedItems.push({
          id: `gp-${p.id}`,
          type: "group_post",
          created_at: p.created_at as string,
          author_id: authorId,
          content: p.content as string,
          image_url: p.image_url as string | null,
          image_urls: (p as Record<string, unknown>).image_urls as string[] ?? [],
          author_name: profile?.full_name || "Anonymous",
          author_headline: profile?.headline ?? null,
          author_avatar: profile?.avatar_url ?? null,
          author_verification: profile?.verification || "unverified",
          author_role: roleMap.get(authorId) ?? null,
          likes_count: gpLikeCounts.get(p.id as string) ?? 0,
          comments_count: gpCommentCounts.get(p.id as string) ?? 0,
          is_liked: gpUserLikedSet.has(p.id as string),
          group_id: p.group_id as string,
          group_name: grp?.name || "Group",
          group_cover_color: grp?.cover_color || "from-blue-600 to-indigo-700",
        });
      });

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

      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return feedItems;
    },
    enabled: !!user,
  });

  useRealtimeSubscription(
    { table: "posts" },
    () => queryClient.invalidateQueries({ queryKey: ["homeFeed"] })
  );
  useRealtimeSubscription(
    { table: "group_posts" },
    () => queryClient.invalidateQueries({ queryKey: ["homeFeed"] })
  );

  return { items, loading: isLoading, refetch: () => queryClient.invalidateQueries({ queryKey: ["homeFeed"] }) };
}
