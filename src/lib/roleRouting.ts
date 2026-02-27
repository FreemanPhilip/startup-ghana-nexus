import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function getRoleDashboardPath(role?: AppRole | null): string {
  switch (role) {
    case "startup_founder":
      return "/founder/dashboard";
    case "investor":
      return "/investor/dashboard";
    case "mentor":
      return "/mentor/dashboard";
    case "ecosystem_partner":
      return "/partner/dashboard";
    default:
      // Fallback for legacy roles (service_provider, member, admin)
      return "/founder/dashboard";
  }
}

export function getRoleFromPath(path: string): AppRole | null {
  if (path.startsWith("/founder")) return "startup_founder";
  if (path.startsWith("/investor")) return "investor";
  if (path.startsWith("/mentor")) return "mentor";
  if (path.startsWith("/partner")) return "ecosystem_partner";
  return null;
}
