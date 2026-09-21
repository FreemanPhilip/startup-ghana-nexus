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
  const readiness = Math.min(100, 30 + startupCount * 35 + mentorConnections * 12 + opportunityCount * 8);

  if (startupCount === 0) {
    return {
      title: "Set up your founder presence",
      description: "Create your startup profile and start building traction with mentors, investors, and your network.",
      actionLabel: "Create startup page",
      readiness,
    };
  }

  return {
    title: "Founder momentum is building",
    description: `You have ${startupCount} startup${startupCount > 1 ? "s" : ""} in motion and are ready to deepen your outreach and build traction.`,
    actionLabel: "Manage startups",
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
  const totalPipeline = savedStartups + pendingRequests + portfolioCount;

  if (totalPipeline === 0) {
    return {
      title: "Start building your deal pipeline",
      description: "Discover promising startups, save the ones you like, and start engaging with founders early.",
      actionLabel: "Discover startups",
    };
  }

  return {
    title: "Your deal pipeline is active",
    description: `You have ${totalPipeline} startup${totalPipeline > 1 ? "s" : ""} in your active pipeline across saved, pending, and portfolio activity.`,
    actionLabel: "Review pipeline",
  };
};

export const buildMentorPipelineSummary = ({
  menteeCount = 0,
  meetingCount = 0,
  openTaskCount = 0,
}: {
  menteeCount?: number;
  meetingCount?: number;
  openTaskCount?: number;
}) => {
  const engagementScore = Math.min(100, 35 + menteeCount * 25 + meetingCount * 8 + openTaskCount * 3);

  if (menteeCount === 0) {
    return {
      title: "Build your mentoring cohort",
      description: "Start connecting with founders, confirm sessions, and assign tasks to create momentum with your mentees.",
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
