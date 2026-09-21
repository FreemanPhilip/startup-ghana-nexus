import { describe, expect, it } from "vitest";
import { canAccessTab, getAdminLevelForRole, getDefaultAdminTab, resolveAdminLevel } from "./adminPermissions";
import { getPostAuthRoute, getRoleDashboardPath, sanitizeAppPath } from "./roleRouting";

describe("roleRouting", () => {
  it("routes signed-in users directly to their dashboard without falling back to the landing page", () => {
    expect(getPostAuthRoute(["mentor"])).toBe("/mentor/dashboard");
    expect(getPostAuthRoute(["admin"], { onboarding_step: "incomplete" } as any)).toBe("/admin/dashboard");
    expect(getPostAuthRoute([], { onboarding_step: "incomplete" } as any)).toBe("/onboarding");
    expect(getPostAuthRoute([], { onboarding_step: "completed" } as any)).toBe("/dashboard");
    expect(getPostAuthRoute(["member"])).toBe("/dashboard");
    expect(getPostAuthRoute(["service_provider"])).toBe("/dashboard");
  });

  it("sends generic user roles to the shared dashboard instead of founder-only routes", () => {
    expect(getRoleDashboardPath("member")).toBe("/dashboard");
    expect(getRoleDashboardPath("service_provider")).toBe("/dashboard");
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
});
