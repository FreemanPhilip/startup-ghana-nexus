import { supabase } from "@/integrations/supabase/client";
import { getProfilesByIds } from "./profiles";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  icon_url: string | null;
  cover_color: string | null;
  category: string | null;
  created_by: string;
  is_private: boolean | null;
  created_at: string;
  member_count: number;
  is_member: boolean;
  my_role: string | null;
  post_count_today: number;
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_headline: string | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}

export interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

export async function fetchAllGroups(userId?: string): Promise<Group[]> {
  const { data: groupsData } = await supabase.from("groups").select("*");
  if (!groupsData) return [];

  const groupIds = groupsData.map(g => g.id);

  const [membersData, postsData] = await Promise.all([
    supabase.from("group_members").select("group_id, user_id, role").in("group_id", groupIds),
    supabase.from("group_posts").select("group_id").in("group_id", groupIds).gte("created_at", new Date().toISOString().slice(0, 10)),
  ]);

  const memberCountMap = new Map<string, number>();
  const myMembershipMap = new Map<string, string>();
  membersData.data?.forEach(m => {
    memberCountMap.set(m.group_id, (memberCountMap.get(m.group_id) || 0) + 1);
    if (m.user_id === userId) myMembershipMap.set(m.group_id, m.role);
  });

  const postCountMap = new Map<string, number>();
  postsData.data?.forEach(p => postCountMap.set(p.group_id, (postCountMap.get(p.group_id) || 0) + 1));

  return groupsData.map(g => ({
    ...g,
    member_count: memberCountMap.get(g.id) || 0,
    is_member: myMembershipMap.has(g.id),
    my_role: myMembershipMap.get(g.id) || null,
    post_count_today: postCountMap.get(g.id) || 0,
  }));
}

export async function fetchGroupDetail(groupId: string, userId?: string): Promise<{
  group: Group | null;
  posts: GroupPost[];
  members: GroupMember[];
}> {
  const { data: g } = await supabase.from("groups").select("*").eq("id", groupId).single();
  if (!g) return { group: null, posts: [], members: [] };

  const { data: membersRaw } = await supabase.from("group_members").select("user_id, role, joined_at").eq("group_id", groupId);
  const memberUserIds = membersRaw?.map(m => m.user_id) || [];
  const profilesMap = await getProfilesByIds(memberUserIds);

  const enrichedMembers: GroupMember[] = (membersRaw || []).map(m => ({
    ...m,
    full_name: profilesMap.get(m.user_id)?.full_name || null,
    avatar_url: profilesMap.get(m.user_id)?.avatar_url || null,
    headline: profilesMap.get(m.user_id)?.headline || null,
  }));

  const isMember = memberUserIds.includes(userId || "");
  const myRole = membersRaw?.find(m => m.user_id === userId)?.role || null;

  const group: Group = {
    ...g,
    member_count: enrichedMembers.length,
    is_member: isMember,
    my_role: myRole,
    post_count_today: 0,
  };

  const { data: postsRaw } = await supabase.from("group_posts").select("*").eq("group_id", groupId).order("created_at", { ascending: false });
  let enrichedPosts: GroupPost[] = [];
  if (postsRaw && postsRaw.length > 0) {
    const authorIds = [...new Set(postsRaw.map(p => p.author_id))];
    const postIds = postsRaw.map(p => p.id);
    const [authorMap, likesRes, commentsRes] = await Promise.all([
      getProfilesByIds(authorIds),
      supabase.from("group_post_likes").select("post_id, user_id").in("post_id", postIds),
      supabase.from("group_post_comments").select("post_id").in("post_id", postIds),
    ]);

    const likeCountMap = new Map<string, number>();
    const userLikedMap = new Map<string, boolean>();
    likesRes.data?.forEach(l => {
      likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1);
      if (l.user_id === userId) userLikedMap.set(l.post_id, true);
    });
    const commentCountMap = new Map<string, number>();
    commentsRes.data?.forEach(c => commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1));

    enrichedPosts = postsRaw.map(p => ({
      id: p.id,
      group_id: p.group_id,
      author_id: p.author_id,
      content: p.content,
      image_url: p.image_url,
      video_url: (p as Record<string, unknown>).video_url as string | null ?? null,
      created_at: p.created_at,
      author_name: authorMap.get(p.author_id)?.full_name || "Unknown",
      author_avatar: authorMap.get(p.author_id)?.avatar_url || null,
      author_headline: authorMap.get(p.author_id)?.headline || null,
      like_count: likeCountMap.get(p.id) || 0,
      comment_count: commentCountMap.get(p.id) || 0,
      is_liked: userLikedMap.get(p.id) || false,
    }));
  }

  return { group, posts: enrichedPosts, members: enrichedMembers };
}

export async function insertGroup(input: {
  name: string;
  description: string;
  is_private: boolean;
  cover_color: string;
  created_by: string;
  category?: string;
  icon_url?: string | null;
}) {
  return supabase.from("groups").insert({
    name: input.name,
    description: input.description,
    is_private: input.is_private,
    cover_color: input.cover_color,
    created_by: input.created_by,
    category: input.category || "general",
    icon_url: input.icon_url || null,
  }).select().single();
}

export async function joinGroup(groupId: string, userId: string) {
  return supabase.from("group_members").insert({ group_id: groupId, user_id: userId });
}

export async function joinGroupAsAdmin(groupId: string, userId: string) {
  return supabase.from("group_members").insert({ group_id: groupId, user_id: userId, role: "admin" });
}

export async function leaveGroup(groupId: string, userId: string) {
  return supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
}

export async function updateGroup(groupId: string, updates: {
  name: string;
  description: string;
  is_private: boolean;
  cover_color: string;
  category: string;
  icon_url: string | null;
}) {
  return supabase.from("groups").update(updates).eq("id", groupId);
}

export async function insertGroupPost(groupId: string, authorId: string, content: string, imageUrl?: string | null, videoUrl?: string | null) {
  return supabase.from("group_posts").insert({
    group_id: groupId,
    author_id: authorId,
    content,
    image_url: imageUrl ?? null,
    video_url: videoUrl ?? null,
  });
}

export async function insertGroupPostLike(postId: string, userId: string) {
  return supabase.from("group_post_likes").insert({ post_id: postId, user_id: userId });
}

export async function deleteGroupPostLike(postId: string, userId: string) {
  return supabase.from("group_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
}

export async function insertGroupPostComment(postId: string, authorId: string, content: string) {
  return supabase.from("group_post_comments").insert({ post_id: postId, author_id: authorId, content });
}
