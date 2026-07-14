import { supabase } from "@/integrations/supabase/client";

export interface Startup {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  logo_url: string | null;
  website_url: string | null;
  location: string | null;
  founded_year: number | null;
  team_size: number | null;
  short_description: string | null;
  verification_status: string;
  created_by: string;
  created_at: string;
}

export interface EnrichedStartup extends Startup {
  member_count: number;
  my_role: string | null;
}

export interface StartupMember {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string | null;
  avatar_url: string | null;
}

export async function fetchStartupsByUser(userId: string): Promise<EnrichedStartup[]> {
  const { data: memberships } = await supabase
    .from("startup_members")
    .select("startup_id, role")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const startupIds = memberships.map(m => m.startup_id);
  const roleMap = new Map(memberships.map(m => [m.startup_id, m.role]));

  const { data } = await supabase.from("startups").select("*").in("id", startupIds);
  if (!data) return [];

  const { data: memberCounts } = await supabase
    .from("startup_members")
    .select("startup_id")
    .in("startup_id", startupIds);

  const countMap = new Map<string, number>();
  memberCounts?.forEach(m => {
    countMap.set(m.startup_id, (countMap.get(m.startup_id) || 0) + 1);
  });

  return data.map(s => ({
    ...s,
    member_count: countMap.get(s.id) || 0,
    my_role: roleMap.get(s.id) || null,
  })) as EnrichedStartup[];
}

export async function fetchStartupDetail(startupId: string): Promise<{
  startup: Startup | null;
  members: StartupMember[];
}> {
  const { data: startup } = await supabase.from("startups").select("*").eq("id", startupId).single();
  if (!startup) return { startup: null, members: [] };

  const { data: membersRaw } = await supabase.from("startup_members").select("user_id, role, joined_at").eq("startup_id", startupId);
  const memberUserIds = membersRaw?.map(m => m.user_id) || [];

  let enrichedMembers: StartupMember[] = [];
  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase.from("public_profiles").select("user_id, full_name, avatar_url").in("user_id", memberUserIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    enrichedMembers = (membersRaw || []).map(m => ({
      ...m,
      full_name: profileMap.get(m.user_id)?.full_name || null,
      avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
    }));
  }

  return { startup: startup as Startup, members: enrichedMembers };
}

export async function createStartup(input: {
  name: string;
  description?: string;
  industry?: string;
  stage?: string;
  logo_url?: string;
  website?: string;
  location?: string;
  founded_year?: number;
  team_size?: number;
  created_by: string;
}) {
  return supabase.from("startups").insert(input).select().single();
}

export async function updateStartup(startupId: string, updates: Partial<Omit<Startup, "id" | "created_at">>) {
  return supabase.from("startups").update(updates).eq("id", startupId);
}

export async function addStartupMember(startupId: string, userId: string, role: string = "member") {
  return supabase.from("startup_members").insert({ startup_id: startupId, user_id: userId, role });
}

export async function removeStartupMember(startupId: string, userId: string) {
  return supabase.from("startup_members").delete().eq("startup_id", startupId).eq("user_id", userId);
}
