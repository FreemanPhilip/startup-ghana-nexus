import { describe, expect, it } from "vitest";
import { buildConversationFilter, buildMentorshipUpdateMessage } from "./MenteeCirclePage";

describe("MenteeCirclePage", () => {
  it("builds a clear mentorship message for meetings and tasks", () => {
    const meetingMessage = buildMentorshipUpdateMessage({
      type: "meeting",
      mentorName: "Ada Mensah",
      title: "Growth check-in",
      date: "2026-09-25",
      time: "15:00",
    });

    const taskMessage = buildMentorshipUpdateMessage({
      type: "task",
      mentorName: "Ada Mensah",
      title: "Customer interview script",
      date: "2026-09-24",
    });

    expect(meetingMessage).toContain("Growth check-in");
    expect(meetingMessage).toContain("2026");
    expect(taskMessage).toContain("Customer interview script");
    expect(taskMessage).toContain("Ada Mensah");
  });

  it("builds a consistent conversation filter for both user ordering combinations", () => {
    const filter = buildConversationFilter("mentor-1", "mentee-2");

    expect(filter).toContain("participant_one.eq.mentor-1");
    expect(filter).toContain("participant_two.eq.mentee-2");
    expect(filter).toContain("participant_one.eq.mentee-2");
    expect(filter).toContain("participant_two.eq.mentor-1");
  });
});
