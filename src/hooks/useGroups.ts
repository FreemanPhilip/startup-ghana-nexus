import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data: groupsData } = await supabase.from("groups").select("*");
    if (!groupsData) { setGroups([]); setMyGroups([]); setLoading(false); return; }

    const groupIds = groupsData.map(g => g.id);

    // Fetch member counts
    const { data: membersData } = await supabase
      .from("group_members")
      .select("group_id, user_id, role")
      .in("group_id", groupIds);

    // Fetch today's post counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: postsData } = await supabase
      .from("group_posts")
      .select("group_id")
      .in("group_id", groupIds)
      .gte("created_at", today.toISOString());

    const memberCountMap = new Map<string, number>();
    const myMembershipMap = new Map<string, string>();
    membersData?.forEach(m => {
      memberCountMap.set(m.group_id, (memberCountMap.get(m.group_id) || 0) + 1);
      if (m.user_id === user?.id) myMembershipMap.set(m.group_id, m.role);
    });

    const postCountMap = new Map<string, number>();
    postsData?.forEach(p => {
      postCountMap.set(p.group_id, (postCountMap.get(p.group_id) || 0) + 1);
    });

    const enriched: Group[] = groupsData.map(g => ({
      ...g,
      member_count: memberCountMap.get(g.id) || 0,
      is_member: myMembershipMap.has(g.id),
      my_role: myMembershipMap.get(g.id) || null,
      post_count_today: postCountMap.get(g.id) || 0,
    }));

    setGroups(enriched);
    setMyGroups(enriched.filter(g => g.is_member));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = async (name: string, description: string, isPrivate: boolean, coverColor: string, category?: string, iconUrl?: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("groups").insert({
      name, description, is_private: isPrivate, cover_color: coverColor, created_by: user.id,
      category: category || "general", icon_url: iconUrl || null,
    } as any).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Auto-join as admin
    await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "admin" });
    toast({ title: "Group created!" });
    fetchGroups();
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Joined group!" });
    fetchGroups();
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    toast({ title: "Left group" });
    fetchGroups();
  };

  const updateGroup = async (groupId: string, updates: { name: string; description: string; is_private: boolean; cover_color: string; category: string; icon_url: string | null }) => {
    if (!user) return;
    const { error } = await supabase.from("groups").update({
      name: updates.name,
      description: updates.description,
      is_private: updates.is_private,
      cover_color: updates.cover_color,
      category: updates.category,
      icon_url: updates.icon_url,
    } as any).eq("id", groupId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Group updated!" });
    fetchGroups();
  };

  return { groups, myGroups, loading, createGroup, joinGroup, leaveGroup, updateGroup, refetch: fetchGroups };
}

export function useGroupDetail(groupId: string | null) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data: g } = await supabase.from("groups").select("*").eq("id", groupId).single();
    if (!g) { setLoading(false); return; }

    // Members with profiles
    const { data: membersRaw } = await supabase.from("group_members").select("user_id, role, joined_at").eq("group_id", groupId);
    const memberUserIds = membersRaw?.map(m => m.user_id) || [];
    const { data: profilesData } = memberUserIds.length > 0
      ? await supabase.from("public_profiles").select("user_id, full_name, avatar_url, headline").in("user_id", memberUserIds)
      : { data: [] };

    const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; headline: string | null }>();
    profilesData?.forEach(p => profileMap.set(p.user_id, p));
    const enrichedMembers: GroupMember[] = (membersRaw || []).map(m => ({
      ...m,
      full_name: profileMap.get(m.user_id)?.full_name || null,
      avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
      headline: profileMap.get(m.user_id)?.headline || null,
    }));

    const isMember = memberUserIds.includes(user?.id || "");
    const myRole = membersRaw?.find(m => m.user_id === user?.id)?.role || null;

    setGroup({
      ...g,
      member_count: enrichedMembers.length,
      is_member: isMember,
      my_role: myRole,
      post_count_today: 0,
    });
    setMembers(enrichedMembers);

    // Posts with author info
    const { data: postsRaw } = await supabase.from("group_posts").select("*").eq("group_id", groupId).order("created_at", { ascending: false });
    if (postsRaw && postsRaw.length > 0) {
      const authorIds = [...new Set(postsRaw.map(p => p.author_id))];
      const { data: authorsData } = await supabase.from("public_profiles").select("user_id, full_name, avatar_url, headline").in("user_id", authorIds);
      const authorMap = new Map(authorsData?.map(a => [a.user_id, a]) || []);

      // Likes & comments counts
      const postIds = postsRaw.map(p => p.id);
      const { data: likesData } = await supabase.from("group_post_likes").select("post_id, user_id").in("post_id", postIds);
      const { data: commentsData } = await supabase.from("group_post_comments").select("post_id").in("post_id", postIds);

      const likeCountMap = new Map<string, number>();
      const userLikedMap = new Map<string, boolean>();
      likesData?.forEach(l => {
        likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1);
        if (l.user_id === user?.id) userLikedMap.set(l.post_id, true);
      });
      const commentCountMap = new Map<string, number>();
      commentsData?.forEach(c => { commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1); });

      setPosts(postsRaw.map(p => ({
        ...p,
        author_name: authorMap.get(p.author_id)?.full_name || "Unknown",
        author_avatar: authorMap.get(p.author_id)?.avatar_url || null,
        author_headline: authorMap.get(p.author_id)?.headline || null,
        like_count: likeCountMap.get(p.id) || 0,
        comment_count: commentCountMap.get(p.id) || 0,
        is_liked: userLikedMap.get(p.id) || false,
      })));
    } else {
      setPosts([]);
    }

    setLoading(false);
  }, [groupId, user]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  // Realtime subscription
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-posts-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_posts", filter: `group_id=eq.${groupId}` }, () => fetchGroup())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_post_comments" }, () => fetchGroup())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, fetchGroup]);

  const createPost = async (content: string, imageUrl?: string, videoUrl?: string) => {
    if (!user || !groupId) return;
    const { error } = await supabase.from("group_posts").insert({
      group_id: groupId, author_id: user.id, content,
      image_url: imageUrl ?? null,
      video_url: videoUrl ?? null,
    } as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.is_liked) {
      await supabase.from("group_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("group_post_likes").insert({ post_id: postId, user_id: user.id });
    }
    fetchGroup();
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    await supabase.from("group_post_comments").insert({ post_id: postId, author_id: user.id, content });
    fetchGroup();
  };

  return { group, posts, members, loading, createPost, toggleLike, addComment, refetch: fetchGroup };
}
