import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function getRoleDashboardPath(role?: AppRole | null): string {
  if (role === "admin") return "/admin/dashboard";
  // Everyone else lands on the unified role-aware home
  return "/home";
}

export function getRoleFromPath(path: string): AppRole | null {
  if (path.startsWith("/founder")) return "startup_founder";
  if (path.startsWith("/investor")) return "investor";
  if (path.startsWith("/mentor")) return "mentor";
  if (path.startsWith("/partner")) return "ecosystem_partner";
  if (path.startsWith("/admin")) return "admin";
  return null;
}
