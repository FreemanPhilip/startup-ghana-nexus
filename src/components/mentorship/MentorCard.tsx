import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface MentorData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  industry: string | null;
  location: string | null;
  years_experience: number | null;
  expertise: string[] | null;
  availability: string | null;
  bio: string | null;
  booking_url: string | null;
  sessions_count: number;
  reviews_count: number;
  rating: number;
  attendance_rate: number;
}

interface MentorCardProps {
  mentor: MentorData;
  onBookSession?: (mentorId: string) => void;
  onViewProfile?: () => void;
}

/** A figure and the word for it — the whole stat, in two lines. */
const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="min-w-0">
    <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    <p className="truncate text-[11px] text-muted-foreground">{label}</p>
  </div>
);

/**
 * A mentor, as a booking decision.
 *
 * The old card led with a 4:3 photo — roughly half its height given to an
 * avatar — then stacked six labelled rows under it, so a grid of mentors was
 * mostly pictures and captions. Someone choosing a mentor is comparing a few
 * numbers and then booking, so the numbers sit in one row and the action is
 * always in the same place.
 */
const MentorCard = ({ mentor, onBookSession, onViewProfile }: MentorCardProps) => {
  const initials =
    mentor.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "M";

  const availableNow = mentor.availability === "available_now";

  return (
    <div
      onClick={onViewProfile}
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={mentor.avatar_url || undefined} alt="" />
          <AvatarFallback className="a-mentor accent-tile h-full w-full rounded-full text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[15px] font-semibold tracking-[-0.01em]">
              {mentor.full_name}
            </h3>
            {availableNow && (
              // A dot and two words, not a pulsing pill: availability is
              // useful, it just is not the most important thing on the card.
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden="true" />
                Available
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {mentor.headline || `${mentor.industry || "Startup"} expert`}
          </p>

          {mentor.rating > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[13px]">
              <Star className="h-3.5 w-3.5 fill-current text-brand" aria-hidden="true" />
              <span className="font-semibold tabular-nums">{mentor.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({mentor.reviews_count})</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
        <Stat value={String(mentor.sessions_count)} label="Sessions" />
        <Stat value={mentor.years_experience ? `${mentor.years_experience}y` : "—"} label="Experience" />
        <Stat value={`${mentor.attendance_rate}%`} label="Attendance" />
      </div>

      <Button
        size="sm"
        className="mt-4 w-full rounded-full text-[13px] font-medium"
        onClick={(e) => {
          e.stopPropagation();
          onBookSession?.(mentor.id);
        }}
      >
        Book a session
      </Button>
    </div>
  );
};

export default MentorCard;
