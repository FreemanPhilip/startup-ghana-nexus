import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";
import { getProfilesWithRoles } from "@/lib/supabase/queries/profiles";

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

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["network"],
    queryFn: async (): Promise<NetworkProfile[]> => {
      const { data: profilesData } = await supabase
        .from("public_profiles")
        .select("user_id, full_name, headline, avatar_url, industry, company_name, company_stage, location, verification, expertise")
        .neq("user_id", user!.id);

      if (!profilesData) return [];

      const userIds = profilesData.map(p => p.user_id);
      const { profiles: profileMap, roles: roleMap } = await getProfilesWithRoles(userIds);

      return profilesData.map(p => ({
        ...p,
        roles: roleMap.get(p.user_id) ? [roleMap.get(p.user_id)!] : [],
      }));
    },
    enabled: !!user,
  });

  return { profiles, loading: isLoading, isFollowing, toggleFollow, followerCount, followingCount };
}
