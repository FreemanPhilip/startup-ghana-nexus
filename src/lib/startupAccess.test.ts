import { describe, expect, it } from "vitest";
import { canCreateStartup, canSeeMyStartups, startupCreationBlockedReason } from "./startupAccess";

describe("startupAccess", () => {
  it("lets founders and admins create", () => {
    expect(canCreateStartup(["startup_founder"])).toBe(true);
    expect(canCreateStartup(["admin"])).toBe(true);
  });

  it("does not let the rest of the ecosystem create", () => {
    // These roles belong around startups, not running one from here.
    for (const role of ["investor", "mentor", "ecosystem_partner", "service_provider", "member"] as const) {
      expect(canCreateStartup([role])).toBe(false);
    }
    expect(canCreateStartup([])).toBe(false);
    expect(canCreateStartup()).toBe(false);
  });

  it("reads the whole roles array, not just the first entry", () => {
    // Someone who onboarded as an investor and later added the founder role
    // has primaryRole "investor" — the old check hid their own startups.
    expect(canCreateStartup(["investor", "startup_founder"])).toBe(true);
  });

  it("shows My Startups to a non-founder who was added to one", () => {
    // An advisor invited onto a startup still needs to reach it; hiding the
    // page would strand a team member.
    expect(canSeeMyStartups(["investor"], 1)).toBe(true);
    expect(canSeeMyStartups(["investor"], 0)).toBe(false);
  });

  it("shows My Startups to a founder with none yet", () => {
    expect(canSeeMyStartups(["startup_founder"], 0)).toBe(true);
  });

  it("explains the block only to those who are blocked", () => {
    expect(startupCreationBlockedReason(["startup_founder"])).toBeNull();
    expect(startupCreationBlockedReason(["mentor"])).toMatch(/founder/i);
  });
});
