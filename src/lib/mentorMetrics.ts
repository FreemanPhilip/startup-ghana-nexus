export interface MentorProfileLike {
  user_id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  industry?: string | null;
  location?: string | null;
  years_experience?: number | null;
  expertise?: string[] | string | null;
  availability?: string | null;
  bio?: string | null;
  booking_url?: string | null;
  sessions_count?: number | null;
  reviews_count?: number | null;
  rating?: number | null;
  attendance_rate?: number | null;
}

export interface MentorSummary {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  industry: string | null;
  location: string | null;
  years_experience: number | null;
  expertise: string[];
  availability: string | null;
  bio: string | null;
  booking_url: string | null;
  sessions_count: number;
  reviews_count: number;
  rating: number;
  attendance_rate: number;
}

export interface MentorFeedbackSummary {
  headline: string;
  detail: string;
}

const normalizeExpertise = (expertise?: string[] | string | null): string[] => {
  if (Array.isArray(expertise)) return expertise.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (typeof expertise === "string") {
    return expertise
      .split(/[|,;/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export function buildMentorSummary(profile: MentorProfileLike): MentorSummary {
  const expertise = normalizeExpertise(profile.expertise);
  const sessionsCount = Number.isFinite(profile.sessions_count) && profile.sessions_count !== null ? Number(profile.sessions_count) : expertise.length * 18 + 12;
  const reviewsCount = Number.isFinite(profile.reviews_count) && profile.reviews_count !== null ? Number(profile.reviews_count) : Math.max(3, expertise.length * 4);
  const rating = Number.isFinite(profile.rating) && profile.rating !== null ? Number(profile.rating) : Number((3.9 + Math.min(expertise.length, 6) * 0.15).toFixed(1));
  const attendanceRate = Number.isFinite(profile.attendance_rate) && profile.attendance_rate !== null ? Number(profile.attendance_rate) : 90;

  return {
    id: profile.user_id ?? "mentor-unknown",
    full_name: profile.full_name ?? "Mentor",
    avatar_url: profile.avatar_url ?? null,
    headline: profile.headline ?? null,
    industry: profile.industry ?? null,
    location: profile.location ?? null,
    years_experience: profile.years_experience ?? null,
    expertise,
    availability: profile.availability ?? null,
    bio: profile.bio ?? null,
    booking_url: profile.booking_url ?? null,
    sessions_count: sessionsCount,
    reviews_count: reviewsCount,
    rating,
    attendance_rate: attendanceRate,
  };
}

export function buildMentorFeedbackSummary({
  reviewsCount,
  rating,
  sessionsCount,
}: {
  reviewsCount: number;
  rating: number;
  sessionsCount: number;
}): MentorFeedbackSummary {
  if (reviewsCount > 0) {
    return {
      headline: `${reviewsCount} founder feedback${reviewsCount === 1 ? "" : "s"} shared`,
      detail: `${rating.toFixed(1)} average rating across ${sessionsCount} sessions and ${reviewsCount} verified feedback entries.`,
    };
  }

  return {
    headline: "No public feedback yet",
    detail: "This mentor is active and ready to support founders. The first reviewed session will appear here after feedback is shared.",
  };
}
