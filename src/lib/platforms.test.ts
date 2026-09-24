import { describe, it, expect } from "vitest";
import { CURRENT_PLATFORM, otherPlatforms, platforms } from "./platforms";

describe("platforms", () => {
  it("lists both SparkX platforms", () => {
    expect(platforms().map((p) => p.id)).toEqual(["index", "talent"]);
  });

  it("points Talent at the same origin the SSO hand-off uses", () => {
    // Three hardcoded copies of the host is how a staging build ends up
    // sending people to production, so the switcher must not have its own.
    const talent = platforms().find((p) => p.id === "talent");
    expect(talent?.href).toBe("https://talent.sparkxglobal.net");
  });

  it("gives every platform an absolute href", () => {
    // These render as plain anchors; a relative href would navigate within
    // the current app instead of switching platform.
    platforms().forEach((p) => {
      expect(p.href).toMatch(/^https?:\/\//);
    });
  });

  it("offers only the platform you are not on", () => {
    expect(otherPlatforms("index").map((p) => p.id)).toEqual(["talent"]);
    expect(otherPlatforms("talent").map((p) => p.id)).toEqual(["index"]);
  });

  it("defaults to this build being the Index", () => {
    expect(CURRENT_PLATFORM).toBe("index");
    expect(otherPlatforms()).toHaveLength(1);
  });
});
