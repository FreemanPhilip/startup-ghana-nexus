import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Who may create a startup page.
 *
 * Founding a company is a claim about who you are, not a feature everyone
 * gets. An investor, mentor or partner belongs to the ecosystem around
 * startups; they do not run one from here. Admins are included so support can
 * set a page up on a founder's behalf.
 *
 * The matching database policy is the real gate — this list only decides what
 * the interface offers. See 20260925140000_gate_startup_creation.sql.
 */
const CREATOR_ROLES: readonly AppRole[] = ["startup_founder", "admin"];

export function canCreateStartup(roles: AppRole[] = []): boolean {
  return roles.some((role) => CREATOR_ROLES.includes(role));
}

/**
 * Whether to show the "My Startups" surface at all.
 *
 * Wider than creation on purpose: someone invited onto a startup as an
 * advisor or operator needs to reach it even though they could not have
 * created it. Hiding the page from them would strand a team member.
 */
export function canSeeMyStartups(roles: AppRole[] = [], startupCount = 0): boolean {
  return canCreateStartup(roles) || startupCount > 0;
}

/** Why the create action is unavailable, for the empty state to explain. */
export function startupCreationBlockedReason(roles: AppRole[] = []): string | null {
  if (canCreateStartup(roles)) return null;
  return "Startup pages are created by founders. Add the founder role to your account to build one.";
}
