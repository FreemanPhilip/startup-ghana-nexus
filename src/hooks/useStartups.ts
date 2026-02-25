import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Startup {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  industry: string | null;
  stage: string | null;
  location: string | null;
  short_description: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  registration_doc_url: string | null;
  verification_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StartupMember {
  id: string;
  startup_id: string;
  user_id: string;
  role: string;
  confirmed: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

export function useStartups() {
  const { user } = useAuth();
  const [myStartups, setMyStartups] = useState<(Startup & { member_count: number; my_role: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyStartups = useCallback(async () => {
    if (!user) { setMyStartups([]); setLoading(false); return; }
    setLoading(true);

    // Get startups where user is a member
    const { data: memberships } = await supabase
      .from("startup_members")
      .select("startup_id, role")
      .eq("user_id", user.id);

    if (!memberships?.length) { setMyStartups([]); setLoading(false); return; }

    const startupIds = memberships.map(m => m.startup_id);
    const roleMap = new Map(memberships.map(m => [m.startup_id, m.role]));

    const { data: startups } = await supabase
      .from("startups")
      .select("*")
      .in("id", startupIds);

    // Get member counts
    const { data: allMembers } = await supabase
      .from("startup_members")
      .select("startup_id")
      .in("startup_id", startupIds)
      .eq("confirmed", true);

    const countMap = new Map<string, number>();
    allMembers?.forEach(m => countMap.set(m.startup_id, (countMap.get(m.startup_id) ?? 0) + 1));

    setMyStartups(
      (startups ?? []).map(s => ({
        ...s,
        member_count: countMap.get(s.id) ?? 0,
        my_role: roleMap.get(s.id) ?? "employee",
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMyStartups(); }, [fetchMyStartups]);

  const createStartup = async (data: {
    name: string;
    industry?: string;
    stage?: string;
    location?: string;
    short_description?: string;
    logo_url?: string;
    website_url?: string;
    linkedin_url?: string;
    registration_doc_url?: string;
  }) => {
    if (!user) return null;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: startup, error } = await supabase
      .from("startups")
      .insert({
        ...data,
        slug,
        created_by: user.id,
      } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchMyStartups();
    return startup;
  };

  const updateStartup = async (id: string, data: Partial<Startup>) => {
    const { error } = await supabase.from("startups").update(data as any).eq("id", id);
    if (error) throw error;
    await fetchMyStartups();
  };

  const inviteTeamMember = async (startupId: string, email: string, role: string) => {
    if (!user) return;
    await supabase.from("startup_invitations").insert({
      startup_id: startupId,
      email,
      role,
      invited_by: user.id,
    } as any);
  };

  return { myStartups, loading, createStartup, updateStartup, inviteTeamMember, refetch: fetchMyStartups };
}
