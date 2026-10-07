import { describe, it, expect } from "vitest";
import { CURRENT_PLATFORM, otherPlatforms, platforms } from "./platforms";

describe("platforms", () => {
  it("lists both SparkX platforms", () => {
    expect(platforms().map((p) => p.id)).toEqual(["index", "talent"]);
  });

  it("points Talent at the switch entry, not its home page", () => {
    // A plain link to talent.sparkxglobal.net lands a signed-in member on a
    // login form for a product they already belong to. The switch entry
    // carries their SparkX account across instead.
    //
    // The host comes from talentSso rather than being spelt again here:
    // three hardcoded copies of it is how a staging build ends up sending
    // people to production.
    const talent = platforms().find((p) => p.id === "talent");
    expect(talent?.href).toBe("https://talent.sparkxglobal.net/auth/sparkx-index/start");
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
