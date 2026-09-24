export interface MentorReviewRecord {
  rating: number;
  reviewerName?: string;
  comment?: string | null;
  created_at: string;
}

export interface PartnerDashboardInput {
  startupCount: number;
  activeProgramCount: number;
  opportunityCount: number;
  engagementRate: number;
}

export const buildMentorReviewSummary = (reviews: MentorReviewRecord[]) => {
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  const fiveStarCount = reviews.filter((review) => review.rating >= 5).length;
  const fourStarCount = reviews.filter((review) => review.rating === 4).length;
  const recentReview = [...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0] ?? null;

  return {
    totalReviews,
    averageRating,
    fiveStarCount,
    fourStarCount,
    recentReview,
  };
};

export const buildPartnerDashboardStats = ({
  startupCount,
  activeProgramCount,
  opportunityCount,
  engagementRate,
}: PartnerDashboardInput) => {
  const totalTracked = startupCount + activeProgramCount + opportunityCount;

  return {
    startupCount,
    activeProgramCount,
    opportunityCount,
    engagementRate,
    totalTracked,
  };
};

export const buildDashboardFallbackMessage = (tab: string) => {
  const cleanTab = tab
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = cleanTab
    ? cleanTab
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Overview";

  return {
    title,
    description: `This ${title.toLowerCase()} section isn’t active in your current workspace yet. Keep working from your dashboard, startup profile, mentor flow, or messages to continue building momentum.`,
  };
};

export const buildFounderDashboardSummary = ({
  startupCount = 0,
  mentorConnections = 0,
  opportunityCount = 0,
}: {
  startupCount?: number;
  mentorConnections?: number;
  opportunityCount?: number;
}) => {
  // Null once setup is done. This used to return a second, cheerier message
  // forever ("Founder momentum is building"), so a permanent banner sat above
  // the dashboard for the entire life of the account. It is a setup
  // indicator: it has a finish line, and crossing it removes the bar.
  if (startupCount > 0) return null;

  const readiness = Math.min(100, 30 + mentorConnections * 12 + opportunityCount * 8);

  return {
    title: "Set up your founder presence",
    actionLabel: "Create startup page",
    readiness,
  };
};

export const buildInvestorDashboardSummary = ({
  savedStartups = 0,
  pendingRequests = 0,
  portfolioCount = 0,
}: {
  savedStartups?: number;
  pendingRequests?: number;
  portfolioCount?: number;
}) => {
  // Same rule as the founder bar: it is a prompt to get started, so once the
  // pipeline exists there is nothing left to prompt.
  if (savedStartups + pendingRequests + portfolioCount > 0) return null;

  return {
    title: "Start building your deal pipeline",
    actionLabel: "Discover startups",
  };
};

export const buildMentorPipelineSummary = ({
  menteeCount = 0,
  meetingCount = 0,
  openTaskCount = 0,
  pendingCount = 0,
}: {
  menteeCount?: number;
  meetingCount?: number;
  openTaskCount?: number;
  /** Founders waiting on an answer to their request to join the cohort. */
  pendingCount?: number;
}) => {
  const engagementScore = Math.min(100, 35 + menteeCount * 25 + meetingCount * 8 + openTaskCount * 3);

  // Unanswered requests are the most useful thing a mentor can act on, so they
  // take priority over the generic copy.
  if (pendingCount > 0) {
    return {
      title: `${pendingCount} founder${pendingCount === 1 ? "" : "s"} waiting on you`,
      description: `${pendingCount === 1 ? "A founder has" : `${pendingCount} founders have`} asked to join your cohort. Accept or decline to let them know where they stand.`,
      actionLabel: `Review request${pendingCount === 1 ? "" : "s"}`,
      engagementScore,
    };
  }

  if (menteeCount === 0) {
    return {
      title: "Build your mentoring cohort",
      description: "Founders join your cohort by requesting mentorship, booking a session, or being assigned by an admin.",
      actionLabel: "Review your cohort",
      engagementScore,
    };
  }

  return {
    title: "Your mentorship pipeline is active",
    description: `You are supporting ${menteeCount} founder${menteeCount > 1 ? "s" : ""} with ${meetingCount} scheduled touchpoint${meetingCount === 1 ? "" : "s"} and ${openTaskCount} open task${openTaskCount === 1 ? "" : "s"}.`,
    actionLabel: "Manage cohort",
    engagementScore,
  };
};

export const buildDeterministicScore = (value: string, min = 70, max = 98) => {
  const safeValue = value?.trim() || "sparkx";
  let hash = 0;

  for (let i = 0; i < safeValue.length; i += 1) {
    hash = (hash * 31 + safeValue.charCodeAt(i)) >>> 0;
  }

  const range = max - min + 1;
  return min + (hash % range);
};

export const buildTrendingTopics = <T extends { category?: string | null; name?: string | null; member_count?: number | null }>(groups: T[]) => {
  const topicMap = new Map<string, number>();

  groups.forEach((group) => {
    const label = (group.category || "community").trim() || "community";
    const nextValue = Math.max(18, Math.min(180, Number(group.member_count || 0) / 2 || 24));
    topicMap.set(label, (topicMap.get(label) || 0) + nextValue);
  });

  return [...topicMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({
      label: label
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "Community",
      count: Math.max(20, Math.round(count)),
    }));
};
