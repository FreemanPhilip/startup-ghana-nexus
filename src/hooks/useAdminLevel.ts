import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAdminLevel, type AdminLevel } from "@/lib/adminPermissions";

export const useAdminLevel = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const { data: adminLevel = "viewer", isLoading } = useQuery({
    queryKey: ["adminLevel", user?.id],
    queryFn: async (): Promise<AdminLevel> => {
      const { data } = await supabase.rpc("get_own_profile");
      const own = data?.[0];

      return resolveAdminLevel(own?.admin_level ?? null, roles);
    },
    enabled: !!user && isAdmin,
  });

  return { adminLevel, loading: isLoading };
};
