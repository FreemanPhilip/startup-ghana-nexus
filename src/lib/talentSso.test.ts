import { describe, expect, it, vi } from "vitest";
import { beginTalentSso, getPortalOrigin, talentCallbackUrl, talentSwitchUrl } from "./talentSso";

describe("talentSso", () => {
  it("uses the configured SparkX Index portal as the return destination", () => {
    vi.stubEnv("VITE_PORTAL_ORIGIN", "https://sparkxglobal.net");

    expect(getPortalOrigin()).toBe("https://sparkxglobal.net");
    expect(talentCallbackUrl()).toBe("https://sparkxglobal.net/auth/talent/callback");
    expect(beginTalentSso()).toContain("redirect_uri=https%3A%2F%2Fsparkxglobal.net%2Fauth%2Ftalent%2Fcallback");

    vi.unstubAllEnvs();
  });

  it("falls back to the trusted SparkX portal when the origin is untrusted", () => {
    vi.stubEnv("VITE_PORTAL_ORIGIN", "https://evil.example");

    expect(getPortalOrigin()).toBe("https://sparkxglobal.net");
    expect(talentCallbackUrl()).toBe("https://sparkxglobal.net/auth/talent/callback");

    vi.unstubAllEnvs();
  });

  it("sends a switch to Talent's entry point rather than its home page", () => {
    // The entry point is what makes the switch seamless: it either finds the
    // member's existing Talent session or asks this app to vouch for them.
    // Linking at the bare origin would show them a login form instead.
    expect(talentSwitchUrl()).toBe("https://talent.sparkxglobal.net/auth/sparkx-index/start");
  });

  it("keeps the assertion out of the address bar by asking for a fragment", () => {
    // The callback reads location.hash, so the redirect_uri must have no
    // query of its own that a fragment would be appended after.
    expect(talentCallbackUrl()).not.toContain("?");
  });
});
