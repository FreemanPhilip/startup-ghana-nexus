export interface StartupReachSummaryInput {
  followers: number;
  teamMembers: number;
  likes: number;
  comments: number;
  posts: number;
}

export interface StartupReachSummary {
  communityReach: number;
  engagementRate: number;
  reachLabel: string;
}

export function buildStartupReachSummary({
  followers,
  teamMembers,
  likes,
  comments,
  posts,
}: StartupReachSummaryInput): StartupReachSummary {
  const communityReach = followers + teamMembers * 3 + posts * 8 + likes + comments;
  const engagementRate = posts > 0 ? Math.min(99, Math.round(((likes + comments) / Math.max(posts * 10, 1)) * 100)) : 0;

  const reachLabel =
    communityReach >= 200
      ? "Strong community reach across your startup and network."
      : communityReach >= 80
        ? "Healthy startup momentum with growing traction."
        : "Early-stage traction — keep sharing updates and engaging with your community.";

  return {
    communityReach,
    engagementRate,
    reachLabel,
  };
}
