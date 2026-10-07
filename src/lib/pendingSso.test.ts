import { beforeEach, describe, expect, it } from "vitest";
import { setPendingSso, takePendingSso } from "./pendingSso";

describe("pendingSso", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns a parked hand-off once, then forgets it", () => {
    setPendingSso("/sso/authorize?redirect_uri=https%3A%2F%2Ftalent.sparkxglobal.net&state=abc");

    expect(takePendingSso()).toBe(
      "/sso/authorize?redirect_uri=https%3A%2F%2Ftalent.sparkxglobal.net&state=abc",
    );
    // Single use: a stale entry must not hijack a later ordinary sign-in.
    expect(takePendingSso()).toBeNull();
  });

  it("returns null when nothing is parked", () => {
    expect(takePendingSso()).toBeNull();
  });

  it("refuses anything that is not an in-app hand-off path", () => {
    // AuthPage navigates to whatever comes back, so an absolute or
    // protocol-relative value here would be an open redirect.
    for (const hostile of [
      "https://evil.example/sso/authorize",
      "//evil.example/sso/authorize",
      "/dashboard",
      "javascript:alert(1)",
    ]) {
      setPendingSso(hostile);
      expect(takePendingSso()).toBeNull();
    }
  });
});
