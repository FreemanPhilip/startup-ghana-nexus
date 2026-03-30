import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AdminLevel } from "@/lib/adminPermissions";

export const useAdminLevel = () => {
  const { user, roles } = useAuth();
  const [adminLevel, setAdminLevel] = useState<AdminLevel>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !roles.includes("admin")) {
      setLoading(false);
      return;
    }

    const fetchLevel = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("admin_level")
        .eq("user_id", user.id)
        .single();

      setAdminLevel((data?.admin_level as AdminLevel) || "viewer");
      setLoading(false);
    };

    fetchLevel();
  }, [user, roles]);

  return { adminLevel, loading };
};
