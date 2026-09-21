import { describe, expect, it } from "vitest";
import { canAccessTab, getAdminLevelForRole, getDefaultAdminTab, resolveAdminLevel } from "./adminPermissions";
import { getPostAuthRoute, getPrimaryDashboardRole, getRoleDashboardPath, parseDashboardPath, sanitizeAppPath } from "./roleRouting";

describe("roleRouting", () => {
  it("routes signed-in users directly to their dashboard without falling back to the landing page", () => {
    expect(getPostAuthRoute(["mentor"])).toBe("/mentor/dashboard");
    expect(getPostAuthRoute(["admin"], { onboarding_step: "incomplete" } as any)).toBe("/admin/dashboard");
    expect(getPostAuthRoute([], { onboarding_step: "incomplete" } as any)).toBe("/onboarding");
    // Users without a dashboard-capable role go to onboarding (a terminal route)
    // so /dashboard never redirects to itself in a loop.
    expect(getPostAuthRoute([], { onboarding_step: "completed" } as any)).toBe("/onboarding");
    expect(getPostAuthRoute(["member"])).toBe("/onboarding");
    expect(getPostAuthRoute(["service_provider"])).toBe("/onboarding");
    // A founder with a secondary non-dashboard role still reaches their dashboard.
    expect(getPostAuthRoute(["member", "startup_founder"])).toBe("/founder/dashboard");
  });

  it("sends non-dashboard roles to onboarding instead of a non-existent shared dashboard", () => {
    expect(getRoleDashboardPath("member")).toBe("/onboarding");
    expect(getRoleDashboardPath("service_provider")).toBe("/onboarding");
    expect(getRoleDashboardPath("startup_founder")).toBe("/founder/dashboard");
  });

  it("rejects unsafe destinations and only allows internal app paths", () => {
    expect(sanitizeAppPath("/mentor/dashboard")).toBe("/mentor/dashboard");
    expect(sanitizeAppPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeAppPath("https://evil.example/steal")).toBe("/dashboard");
    expect(sanitizeAppPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeAppPath("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeAppPath(" ")).toBe("/dashboard");
  });

  it("keeps the super admin dashboard on a safe default tab and exposes the right access", () => {
    expect(getDefaultAdminTab("super_admin")).toBe("overview");
    expect(getDefaultAdminTab("admin")).toBe("overview");
    expect(getDefaultAdminTab("viewer")).toBe("overview");
    expect(canAccessTab("super_admin", "invitations")).toBe(true);
    expect(canAccessTab("viewer", "users")).toBe(false);
  });

  it("preserves admin access when the profile admin_level has not synced yet", () => {
    expect(resolveAdminLevel(null, ["admin"])).toBe("admin");
    expect(resolveAdminLevel("super_admin", ["admin"])).toBe("super_admin");
    expect(resolveAdminLevel(null, [])).toBe("viewer");
  });

  it("keeps the stored admin tier aligned with the real admin role", () => {
    expect(getAdminLevelForRole("admin")).toBe("admin");
    expect(getAdminLevelForRole("startup_founder")).toBeNull();
  });

  it("parses dashboard paths into a tab and an optional id segment", () => {
    expect(parseDashboardPath("/founder/dashboard", "/founder/dashboard")).toEqual({ tab: "home", id: null });
    expect(parseDashboardPath("/founder/dashboard/", "/founder/dashboard")).toEqual({ tab: "home", id: null });
    expect(parseDashboardPath("/founder/dashboard/network", "/founder/dashboard")).toEqual({ tab: "network", id: null });
    expect(parseDashboardPath("/founder/dashboard/startup-profile/abc-123", "/founder/dashboard")).toEqual({ tab: "startup-profile", id: "abc-123" });
    expect(parseDashboardPath("/admin/dashboard/users", "/admin/dashboard")).toEqual({ tab: "users", id: null });
  });

  it("picks the first role that owns a dashboard", () => {
    expect(getPrimaryDashboardRole([])).toBeNull();
    expect(getPrimaryDashboardRole(["member"])).toBeNull();
    expect(getPrimaryDashboardRole(["service_provider", "investor"])).toBe("investor");
    expect(getPrimaryDashboardRole(["admin", "startup_founder"])).toBe("admin");
  });
});
