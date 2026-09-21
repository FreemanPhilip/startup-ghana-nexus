export type AdminLevel = "super_admin" | "admin" | "viewer";

export const resolveAdminLevel = (storedLevel?: string | null, roles: string[] = []): AdminLevel => {
  const normalized = (storedLevel ?? "").trim().toLowerCase();

  if (normalized === "super_admin" || normalized === "admin" || normalized === "viewer") {
    return normalized as AdminLevel;
  }

  if (roles.includes("admin")) {
    return "admin";
  }

  return "viewer";
};

export const getAdminLevelForRole = (role?: string | null): "admin" | "super_admin" | null => {
  if (!role) return null;

  switch (role.toLowerCase()) {
    case "admin":
      return "admin";
    default:
      return null;
  }
};

export const ADMIN_LEVELS: { value: AdminLevel; label: string; description: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Full platform control, can manage other admins" },
  { value: "admin", label: "Admin", description: "Manage users, content, and verification" },
  { value: "viewer", label: "Viewer", description: "Read-only dashboard access" },
];

// Which sidebar tabs each role can see
export const ADMIN_TAB_ACCESS: Record<AdminLevel, string[]> = {
  super_admin: ["overview", "users", "startups", "opportunities", "posts", "verification", "contact", "invitations", "analytics", "audit"],
  admin: ["overview", "users", "startups", "opportunities", "posts", "verification", "contact", "analytics"],
  viewer: ["overview", "analytics", "contact"],
};

// Which actions each role can perform
export const ADMIN_ACTION_ACCESS: Record<AdminLevel, string[]> = {
  super_admin: [
    "change_role", "reset_password", "invite_admin", "delete_invitation",
    "approve_verification", "reject_verification", "export_csv",
    "manage_admin_level", "delete_content",
  ],
  admin: [
    "change_role", "approve_verification", "reject_verification", "export_csv",
  ],
  viewer: [],
};

export const getDefaultAdminTab = (level: AdminLevel): string => {
  const allowed = ADMIN_TAB_ACCESS[level] ?? ADMIN_TAB_ACCESS.viewer;
  return allowed.includes("overview") ? "overview" : allowed[0] ?? "overview";
};

export const canAccessTab = (level: AdminLevel, tab: string): boolean => {
  return ADMIN_TAB_ACCESS[level]?.includes(tab) ?? false;
};

export const canPerformAction = (level: AdminLevel, action: string): boolean => {
  return ADMIN_ACTION_ACCESS[level]?.includes(action) ?? false;
};
