import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Types are derived from the generated database types rather than hand-written,
 * so a schema change surfaces as a compile error instead of a runtime 400.
 */
export type Startup = Database["public"]["Tables"]["startups"]["Row"];
export type StartupInsert = Database["public"]["Tables"]["startups"]["Insert"];
export type StartupUpdate = Database["public"]["Tables"]["startups"]["Update"];

type StartupMemberRow = Database["public"]["Tables"]["startup_members"]["Row"];

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
  const { data: memberships, error: membershipsError } = await supabase
    .from("startup_members")
    .select("startup_id, role")
    .eq("user_id", userId);

  if (membershipsError) throw membershipsError;
  if (!memberships || memberships.length === 0) return [];

  const startupIds = memberships.map(m => m.startup_id);
  const roleMap = new Map<string, string>(memberships.map(m => [m.startup_id, m.role]));

  const { data, error } = await supabase.from("startups").select("*").in("id", startupIds);
  if (error) throw error;
  if (!data) return [];

  const { data: memberCounts, error: countsError } = await supabase
    .from("startup_members")
    .select("startup_id")
    .in("startup_id", startupIds);

  if (countsError) throw countsError;

  const countMap = new Map<string, number>();
  memberCounts?.forEach(m => {
    countMap.set(m.startup_id, (countMap.get(m.startup_id) || 0) + 1);
  });

  return data.map(s => ({
    ...s,
    member_count: countMap.get(s.id) || 0,
    my_role: roleMap.get(s.id) || null,
  }));
}

export async function fetchStartupDetail(startupId: string): Promise<{
  startup: Startup | null;
  members: StartupMember[];
}> {
  const { data: startup, error } = await supabase
    .from("startups")
    .select("*")
    .eq("id", startupId)
    .maybeSingle();

  if (error) throw error;
  if (!startup) return { startup: null, members: [] };

  // startup_members has no joined_at column; created_at is when the row was added.
  const { data: membersRaw, error: membersError } = await supabase
    .from("startup_members")
    .select("user_id, role, created_at")
    .eq("startup_id", startupId);

  if (membersError) throw membersError;

  const memberUserIds = membersRaw?.map(m => m.user_id) ?? [];

  let enrichedMembers: StartupMember[] = [];
  if (memberUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("public_profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", memberUserIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(
      (profiles ?? [])
        .filter((p): p is { user_id: string; full_name: string | null; avatar_url: string | null } =>
          p.user_id !== null
        )
        .map(p => [p.user_id, p])
    );

    enrichedMembers = (membersRaw ?? []).map(m => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.created_at,
      full_name: profileMap.get(m.user_id)?.full_name ?? null,
      avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
    }));
  }

  return { startup, members: enrichedMembers };
}

export async function createStartup(input: StartupInsert): Promise<Startup> {
  const { data, error } = await supabase.from("startups").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateStartup(startupId: string, updates: StartupUpdate): Promise<void> {
  const { error } = await supabase.from("startups").update(updates).eq("id", startupId);
  if (error) throw error;
}

export async function addStartupMember(
  startupId: string,
  userId: string,
  role: string = "member"
): Promise<void> {
  const { error } = await supabase
    .from("startup_members")
    .insert({ startup_id: startupId, user_id: userId, role } satisfies Pick<
      StartupMemberRow,
      "startup_id" | "user_id" | "role"
    >);
  if (error) throw error;
}

export async function removeStartupMember(startupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("startup_members")
    .delete()
    .eq("startup_id", startupId)
    .eq("user_id", userId);
  if (error) throw error;
}
