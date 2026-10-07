import { describe, expect, it } from "vitest";
import { browseAudience } from "./browseAudience";
import type { RailRole } from "./dashboardRail";

const ROLES: RailRole[] = ["startup_founder", "mentor", "investor", "ecosystem_partner"];

describe("browseAudience", () => {
  it("does not show a mentor a list of other mentors", () => {
    // The whole bug: Browse was hardcoded to mentors, so a mentor looking for
    // people to work with was shown people in the same seat.
    const mentorSees = browseAudience("mentor");
    expect(mentorSees.roles).toEqual(["startup_founder"]);
    expect(mentorSees.roles).not.toContain("mentor");
  });

  it("shows a founder the mentors taking sessions", () => {
    const founderSees = browseAudience("startup_founder");
    expect(founderSees.roles).toEqual(["mentor"]);
    expect(founderSees.availableOnly).toBe(true);
  });

  it("only filters on availability where the audience sets one", () => {
    // Founders never fill in an availability window, so filtering on it would
    // return an empty list forever.
    for (const role of ["mentor", "investor", "ecosystem_partner"] as const) {
      expect(browseAudience(role).availableOnly).toBe(false);
    }
  });

  it("never lists admins", () => {
    // Matches public_discovery_role, which excludes admin at the database.
    for (const role of ROLES) {
      expect(browseAudience(role).roles).not.toContain("admin");
    }
  });

  it("excludes nobody by leaving roles empty only deliberately", () => {
    // Every audience is explicit today; an empty list would silently mean
    // "everyone", which is a surprising default to reach by accident.
    for (const role of ROLES) {
      expect(browseAudience(role).roles.length).toBeGreaterThan(0);
    }
  });

  it.each(ROLES)("gives %s its own wording", (role) => {
    const a = browseAudience(role);
    expect(a.title).toMatch(/^Browse /);
    expect(a.empty).not.toBe("");
    expect(a.emptySearch).not.toBe("");
  });

  it("falls back to mentors for an unknown role", () => {
    expect(browseAudience(null).roles).toEqual(["mentor"]);
  });
});
