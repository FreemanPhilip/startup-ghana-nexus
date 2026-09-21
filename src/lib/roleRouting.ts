import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type ProfileLike = {
  onboarding_step?: string | null;
};

export function sanitizeAppPath(path: string | null | undefined, fallback = "/dashboard"): string {
  const candidate = typeof path === "string" ? path.trim() : "";

  if (!candidate || !candidate.startsWith("/")) {
    return fallback;
  }

  if (
    candidate.startsWith("//") ||
    candidate.includes("://") ||
    candidate.includes("\\") ||
    /^(?:javascript|data):/i.test(candidate)
  ) {
    return fallback;
  }

  return candidate;
}

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
    case "admin":
      return "/admin/dashboard";
    case "member":
    case "service_provider":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export function getPostAuthRoute(roles: AppRole[] = [], profile?: ProfileLike | null): string {
  if (roles.includes("admin")) {
    return "/admin/dashboard";
  }

  if (profile && profile.onboarding_step !== "completed") {
    return "/onboarding";
  }

  if (roles.length > 0) {
    return getRoleDashboardPath(roles[0]);
  }

  return "/dashboard";
}

export function getRoleFromPath(path: string): AppRole | null {
  if (path.startsWith("/founder")) return "startup_founder";
  if (path.startsWith("/investor")) return "investor";
  if (path.startsWith("/mentor")) return "mentor";
  if (path.startsWith("/partner")) return "ecosystem_partner";
  if (path.startsWith("/admin")) return "admin";
  return null;
}
