import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";

export interface NetworkProfile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  industry: string | null;
  company_name: string | null;
  company_stage: string | null;
  location: string | null;
  verification: string;
  expertise: string[] | null;
  roles: string[];
}

export function useNetwork() {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, followerCount, followingCount } = useFollows();
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    // Fetch all profiles except current user
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, headline, avatar_url, industry, company_name, company_stage, location, verification, expertise")
      .neq("user_id", user?.id ?? "");

    if (!profilesData) { setProfiles([]); setLoading(false); return; }

    // Fetch roles for all these users
    const userIds = profilesData.map(p => p.user_id);
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const rolesMap = new Map<string, string[]>();
    rolesData?.forEach(r => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    const enriched: NetworkProfile[] = profilesData.map(p => ({
      ...p,
      roles: rolesMap.get(p.user_id) || ["member"],
    }));

    setProfiles(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  return { profiles, loading, isFollowing, toggleFollow, followerCount, followingCount, refetch: fetchProfiles };
}
