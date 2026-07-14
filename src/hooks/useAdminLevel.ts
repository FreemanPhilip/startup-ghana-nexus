import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AdminLevel } from "@/lib/adminPermissions";

export const useAdminLevel = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const { data: adminLevel = "viewer", isLoading } = useQuery({
    queryKey: ["adminLevel", user?.id],
    queryFn: async (): Promise<AdminLevel> => {
      const { data } = await supabase
        .from("profiles")
        .select("admin_level")
        .eq("user_id", user!.id)
        .single();
      return (data?.admin_level as AdminLevel) || "viewer";
    },
    enabled: !!user && isAdmin,
  });

  return { adminLevel, loading: isLoading };
};
