import { supabase } from "@/integrations/supabase/client";

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) => {
  try {
    await supabase.from("admin_audit_logs" as any).insert({
      admin_id: adminId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      details: details || {},
    });
  } catch (e) {
    console.error("Failed to log admin action:", e);
  }
};
