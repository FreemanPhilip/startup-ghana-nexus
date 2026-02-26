import { Star, Calendar, Clock, MapPin, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const MentorCard = ({ mentor, onBookSession, onViewProfile }: MentorCardProps) => {
  const initials = mentor.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  const availabilityBadge = () => {
    if (mentor.availability === "available_now") {
      return (
        <Badge className="absolute bottom-3 left-3 bg-secondary text-secondary-foreground border-0 text-[10px] font-semibold gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary-foreground animate-pulse" />
          Available ASAP
        </Badge>
      );
    }
    if (mentor.availability === "advance") {
      return (
        <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground border-0 text-[10px] font-semibold gap-1">
          <Calendar className="h-2.5 w-2.5" />
          Advance
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg hover:border-primary/30 cursor-pointer h-full" onClick={onViewProfile}>
      {/* Avatar / Image area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {mentor.avatar_url ? (
          <img
            src={mentor.avatar_url}
            alt={mentor.full_name || "Mentor"}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-gold">
            <span className="text-4xl font-display font-bold text-primary-foreground">{initials}</span>
          </div>
        )}
        {availabilityBadge()}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <h3 className="font-display font-bold text-sm text-foreground truncate">
            {mentor.full_name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {mentor.headline || `${mentor.industry || "Startup"} Expert`}
          </p>
        </div>

        {/* Sessions & Reviews */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-medium">{mentor.sessions_count} sessions</span>
          <span>({mentor.reviews_count} reviews)</span>
        </div>

        {/* Experience & Attendance */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Experience</p>
            <p className="text-sm font-bold text-foreground">
              {mentor.years_experience || "—"} years
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Avg. Attendance</p>
            <p className="text-sm font-bold text-foreground">{mentor.attendance_rate}%</p>
          </div>
        </div>

        {/* Book button */}
        <Button
          size="sm"
          className="w-full text-xs font-semibold mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            onBookSession?.(mentor.id);
          }}
        >
          Book a Session
        </Button>
      </div>
    </div>
  );
};

export default MentorCard;
