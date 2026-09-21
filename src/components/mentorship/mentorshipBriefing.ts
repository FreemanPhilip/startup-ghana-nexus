export type BriefingUpdateType = "meeting" | "task";

export interface BriefingUpdate {
  id: string;
  title: string;
  body: string | null;
  type: BriefingUpdateType;
  created_at: string;
  actor_name?: string | null;
}

export interface MentorBriefingSummary {
  total: number;
  meetingCount: number;
  taskCount: number;
  latestUpdate: BriefingUpdate | null;
}

export const buildMentorBriefingSummary = (updates: BriefingUpdate[]): MentorBriefingSummary => {
  if (!updates.length) {
    return { total: 0, meetingCount: 0, taskCount: 0, latestUpdate: null };
  }

  const meetingCount = updates.filter(update => update.type === "meeting").length;
  const taskCount = updates.filter(update => update.type === "task").length;
  const latestUpdate = [...updates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return {
    total: updates.length,
    meetingCount,
    taskCount,
    latestUpdate,
  };
};
