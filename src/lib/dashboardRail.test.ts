import { describe, expect, it } from "vitest";
import { railConfig, type RailRole } from "./dashboardRail";

// The tab ids each dashboard page actually renders. A rail button pointing at
// anything else is a dead click, which is the bug this config exists to stop.
const TABS: Record<RailRole, string[]> = {
  startup_founder: [
    "groups", "home", "investors", "mentor-briefing", "mentors", "messages",
    "my-sessions", "my-startups", "network", "opportunities", "profile",
    "public-profile", "settings", "startup-profile",
  ],
  mentor: [
    "availability", "home", "mentees", "messages", "my-sessions", "profile",
    "public-profile", "reviews", "settings",
  ],
  investor: [
    "discover", "home", "messages", "portfolio", "profile", "public-profile",
    "saved", "settings", "startup-profile",
  ],
  ecosystem_partner: [
    "analytics", "home", "messages", "opportunities", "profile", "programs",
    "public-profile", "settings", "startups",
  ],
};

const ROLES = Object.keys(TABS) as RailRole[];

describe("dashboardRail", () => {
  it.each(ROLES)("only sends %s to tabs that dashboard has", (role) => {
    const config = railConfig(role);

    if (config.upcoming.allTab) {
      expect(TABS[role]).toContain(config.upcoming.allTab);
    }
    config.upcoming.actions.forEach((action) => {
      if (action.target.kind === "tab") {
        expect(TABS[role]).toContain(action.target.tab);
      }
    });
  });

  it.each(ROLES)("gives %s exactly two actions, one of them primary", (role) => {
    const actions = railConfig(role).upcoming.actions;
    // Two, because the card lays them out in a two-column grid.
    expect(actions).toHaveLength(2);
    expect(actions.filter((a) => a.emphasis === "primary")).toHaveLength(1);
  });

  it("gives every role a way to browse people", () => {
    // Browse is for everyone; who it lists is browseAudience's job, not this
    // config's — a mentor gets the button and sees founders behind it.
    for (const role of ROLES) {
      const dialogs = railConfig(role)
        .upcoming.actions.filter((a) => a.target.kind === "dialog")
        .map((a) => (a.target as { dialog: string }).dialog);
      expect(dialogs).toContain("browse-people");
    }
  });

  it("offers AI mentor matching only where looking for a mentor is the point", () => {
    const hasMatch = (role: RailRole) =>
      railConfig(role).upcoming.actions.some(
        (a) => a.target.kind === "dialog" && a.target.dialog === "ai-match",
      );
    expect(hasMatch("startup_founder")).toBe(true);
    expect(hasMatch("mentor")).toBe(false);
    expect(hasMatch("investor")).toBe(false);
  });

  it("counts a mentor's own side of a booking", () => {
    expect(railConfig("mentor").progress?.side).toBe("mentor");
    expect(railConfig("startup_founder").progress?.side).toBe("mentee");
  });

  it("drops the progress card where every figure would be zero", () => {
    // Investors and partners have no mentorship funnel; 0 / 20 forever is
    // furniture, not a summary.
    expect(railConfig("investor").progress).toBeNull();
    expect(railConfig("ecosystem_partner").progress).toBeNull();
    expect(railConfig("startup_founder").progress).not.toBeNull();
  });

  it("hides the All link where the dashboard has no sessions tab", () => {
    expect(railConfig("investor").upcoming.allTab).toBeNull();
    expect(railConfig("ecosystem_partner").upcoming.allTab).toBeNull();
    expect(railConfig("mentor").upcoming.allTab).toBe("my-sessions");
  });

  it("falls back to actions that work anywhere for an unknown role", () => {
    // The founder rail's buttons open dialogs owned by the rail, so they
    // cannot navigate somewhere that does not exist.
    const fallback = railConfig(null);
    expect(fallback.upcoming.actions.every((a) => a.target.kind === "dialog")).toBe(true);
  });
});
