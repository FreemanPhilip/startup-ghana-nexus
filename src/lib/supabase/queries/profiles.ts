import { supabase } from "@/integrations/supabase/client";

export interface EnrichedProfile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  verification: string;
  company_name: string | null;
  location: string | null;
  industry: string | null;
  expertise: string[] | null;
}

const PROFILE_FIELDS = "user_id, full_name, headline, avatar_url, verification, company_name, location, industry, expertise";

export async function getProfilesByIds(userIds: string[]): Promise<Map<string, EnrichedProfile>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from("public_profiles")
    .select(PROFILE_FIELDS)
    .in("user_id", userIds);
  return new Map(data?.map(p => [p.user_id, p]) ?? []);
}

export async function getProfileById(userId: string): Promise<EnrichedProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select(PROFILE_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getProfilesWithRoles(userIds: string[]): Promise<{ profiles: Map<string, EnrichedProfile>; roles: Map<string, string> }> {
  if (userIds.length === 0) return { profiles: new Map(), roles: new Map() };
  const [profilesRes, rolesRes] = await Promise.all([
    getProfilesByIds(userIds),
    supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
  ]);
  const roles = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) ?? []);
  return { profiles: profilesRes, roles };
}
