import { describe, expect, it } from "vitest";
import {
  buildDashboardFallbackMessage,
  buildDeterministicScore,
  buildFounderDashboardSummary,
  buildInvestorDashboardSummary,
  buildMentorPipelineSummary,
  buildMentorReviewSummary,
  buildPartnerDashboardStats,
  buildTrendingTopics,
} from "./dashboardMetrics";

describe("dashboardMetrics", () => {
  it("summarizes mentor reviews into rating and trend data", () => {
    const summary = buildMentorReviewSummary([
      { rating: 5, reviewerName: "Ada", comment: "Excellent", created_at: "2026-09-01T00:00:00Z" },
      { rating: 4, reviewerName: "Ben", comment: "Helpful", created_at: "2026-09-02T00:00:00Z" },
      { rating: 5, reviewerName: "Cleo", comment: "Strong guidance", created_at: "2026-09-03T00:00:00Z" },
    ]);

    expect(summary.totalReviews).toBe(3);
    expect(summary.averageRating).toBeCloseTo(4.67, 2);
    expect(summary.fiveStarCount).toBe(2);
  });

  it("builds a partner overview using actual startup and program counts", () => {
    const stats = buildPartnerDashboardStats({
      startupCount: 42,
      activeProgramCount: 7,
      opportunityCount: 18,
      engagementRate: 81,
    });

    expect(stats.startupCount).toBe(42);
    expect(stats.activeProgramCount).toBe(7);
    expect(stats.engagementRate).toBe(81);
    expect(stats.totalTracked).toBe(42 + 7 + 18);
  });

  it("returns a useful fallback message for an unimplemented dashboard tab", () => {
    const fallback = buildDashboardFallbackMessage("analytics-overview");

    expect(fallback.title).toBe("Analytics Overview");
    expect(fallback.description).toContain("analytics overview");
  });

  it("builds a founder action summary with a clear next step", () => {
    const summary = buildFounderDashboardSummary({ startupCount: 0 });

    expect(summary?.title).toContain("Set up");
    expect(summary?.actionLabel).toBe("Create startup page");
  });

  it("stops prompting the founder once a startup page exists", () => {
    // The bar is a setup indicator, not a permanent banner. Returning a
    // second, cheerier message here is what kept it on screen forever.
    expect(buildFounderDashboardSummary({ startupCount: 1 })).toBeNull();
  });

  it("builds an investor pipeline summary with a meaningful default CTA", () => {
    const summary = buildInvestorDashboardSummary({ savedStartups: 0, pendingRequests: 0, portfolioCount: 0 });

    expect(summary?.title).toContain("Start building");
    expect(summary?.actionLabel).toBe("Discover startups");
  });

  it("stops prompting the investor once a pipeline exists", () => {
    expect(buildInvestorDashboardSummary({ savedStartups: 2 })).toBeNull();
  });

  it("builds an active mentor pipeline summary for connected founders and tasks", () => {
    const summary = buildMentorPipelineSummary({ menteeCount: 2, meetingCount: 4, openTaskCount: 3 });

    expect(summary.title).toContain("Your mentorship pipeline is active");
    expect(summary.actionLabel).toBe("Manage cohort");
    expect(summary.engagementScore).toBeGreaterThan(0);
  });

  it("surfaces pending cohort requests ahead of the generic mentor copy", () => {
    const summary = buildMentorPipelineSummary({ menteeCount: 0, pendingCount: 2 });

    expect(summary.title).toContain("2 founders waiting");
    expect(summary.actionLabel).toBe("Review requests");
  });

  it("uses singular wording for a single pending request", () => {
    const summary = buildMentorPipelineSummary({ menteeCount: 3, pendingCount: 1 });

    expect(summary.title).toContain("1 founder waiting");
    expect(summary.actionLabel).toBe("Review request");
  });

  it("builds deterministic match scores without using random values", () => {
    const score = buildDeterministicScore("Nairobi Tech Capital");

    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(98);
  });

  it("builds stable trending topics from actual group data", () => {
    const topics = buildTrendingTopics([
      { category: "fintech", name: "FinTech Founders", member_count: 180 },
      { category: "fintech", name: "Payments Africa", member_count: 200 },
      { category: "climate", name: "Climate Builders", member_count: 130 },
    ]);

    expect(topics[0].label).toBe("Fintech");
    expect(topics[0].count).toBeGreaterThan(0);
  });
});
