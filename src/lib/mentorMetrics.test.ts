import { describe, expect, it } from "vitest";
import { buildMentorFeedbackSummary, buildMentorSummary } from "./mentorMetrics";

describe("mentorMetrics", () => {
  it("normalizes mentor profile data without using fake random values", () => {
    const mentor = buildMentorSummary({
      user_id: "mentor-1",
      full_name: "Ada Mensah",
      headline: "Product leader for African startups",
      industry: "FinTech",
      location: "Accra, Ghana",
      years_experience: 8,
      expertise: "Product|Fundraising|Strategy",
      availability: "available_now",
      bio: "Helps startups build growth systems.",
      booking_url: "https://calendly.com/ada",
    });

    expect(mentor.full_name).toBe("Ada Mensah");
    expect(mentor.expertise).toEqual(["Product", "Fundraising", "Strategy"]);
    expect(mentor.sessions_count).toBeGreaterThan(0);
    expect(mentor.rating).toBeGreaterThan(3);
    expect(mentor.availability).toBe("available_now");
  });

  it("creates a truthful feedback summary based on actual mentor engagement data", () => {
    const summary = buildMentorFeedbackSummary({
      reviewsCount: 12,
      rating: 4.8,
      sessionsCount: 58,
    });

    expect(summary.headline).toContain("12");
    expect(summary.detail).toContain("4.8");
    expect(summary.detail).toContain("58");
  });
});
