import { describe, expect, it } from "vitest";
import { buildMentorBriefingSummary } from "./mentorshipBriefing";

describe("mentorship briefing", () => {
  it("summarizes meeting and task updates clearly", () => {
    const summary = buildMentorBriefingSummary([
      {
        id: "1",
        title: "Growth check-in",
        body: "We reviewed traction and next milestones.",
        type: "meeting",
        created_at: "2026-09-18T10:00:00.000Z",
        actor_name: "Ada Mensah",
      },
      {
        id: "2",
        title: "Customer interviews",
        body: "Please schedule five interviews this week.",
        type: "task",
        created_at: "2026-09-19T11:00:00.000Z",
        actor_name: "Ada Mensah",
      },
      {
        id: "3",
        title: "Follow-up session",
        body: "Let’s review the product narrative.",
        type: "meeting",
        created_at: "2026-09-20T09:30:00.000Z",
        actor_name: "Ada Mensah",
      },
    ]);

    expect(summary.total).toBe(3);
    expect(summary.meetingCount).toBe(2);
    expect(summary.taskCount).toBe(1);
    expect(summary.latestUpdate?.title).toBe("Follow-up session");
  });
});
