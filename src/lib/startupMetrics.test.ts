import { describe, expect, it } from "vitest";
import { buildStartupReachSummary } from "./startupMetrics";

describe("startupMetrics", () => {
  it("builds a meaningful community reach summary from real startup signals", () => {
    const summary = buildStartupReachSummary({
      followers: 24,
      teamMembers: 6,
      likes: 96,
      comments: 18,
      posts: 8,
    });

    expect(summary.communityReach).toBe(24 + 6 * 3 + 8 * 8 + 96 + 18);
    expect(summary.engagementRate).toBeGreaterThan(0);
    expect(summary.reachLabel).toContain("reach");
  });
});
