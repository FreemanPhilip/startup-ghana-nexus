import { describe, expect, it, vi } from "vitest";
import { beginTalentSso, getPortalOrigin, talentCallbackUrl } from "./talentSso";

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
});
