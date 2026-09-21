import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type ProfileLike = {
  onboarding_step?: string | null;
};

// Roles that own a URL-backed dashboard. Anything else must never be sent to
// "/dashboard", otherwise DashboardRedirect would bounce forever.
const DASHBOARD_ROLES = new Set<AppRole>([
  "startup_founder",
  "investor",
  "mentor",
  "ecosystem_partner",
  "admin",
]);

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
    default:
      // member / service_provider / unknown roles have no dashboard — send them
      // to onboarding (a terminal route) instead of looping on /dashboard.
      return "/onboarding";
  }
}

export function getPrimaryDashboardRole(roles: AppRole[] = []): AppRole | null {
  return roles.find((role) => DASHBOARD_ROLES.has(role)) ?? null;
}

export function getPostAuthRoute(roles: AppRole[] = [], profile?: ProfileLike | null): string {
  const primary = getPrimaryDashboardRole(roles);

  if (primary === "admin") {
    return "/admin/dashboard";
  }

  if (profile && profile.onboarding_step !== "completed") {
    return "/onboarding";
  }

  return primary ? getRoleDashboardPath(primary) : "/onboarding";
}

export function getRoleFromPath(path: string): AppRole | null {
  if (path.startsWith("/founder")) return "startup_founder";
  if (path.startsWith("/investor")) return "investor";
  if (path.startsWith("/mentor")) return "mentor";
  if (path.startsWith("/partner")) return "ecosystem_partner";
  if (path.startsWith("/admin")) return "admin";
  return null;
}

export interface DashboardRoute {
  tab: string;
  id: string | null;
}

/** Split a dashboard path like "/founder/dashboard/groups/abc" into its tab and optional id segment. */
export function parseDashboardPath(pathname: string, basePath: string): DashboardRoute {
  const base = basePath.replace(/\/+$/, "");
  const suffix = pathname.startsWith(base) ? pathname.slice(base.length) : "";
  const segments = suffix.split("/").filter(Boolean);
  const tab = segments[0] || "home";
  let id: string | null = null;
  if (segments[1]) {
    try {
      id = decodeURIComponent(segments[1]);
    } catch {
      id = segments[1];
    }
  }
  return { tab, id };
}
