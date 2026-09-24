import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";

interface ProfileRailCardProps {
  onNavigate?: (tab: string) => void;
}

const initials = (name?: string | null) =>
  (name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

/**
 * The identity card at the top of the left rail.
 *
 * Replaces a four-box stat grid that spelled out FOLLOWERS / FOLLOWING /
 * ROLE / MEMBERSHIP in tracked caps — four labels to say what a name, a
 * headline and two numbers say on their own. Numbers sit next to their word,
 * the way every social product does it, and the whole card is one target to
 * the profile.
 */
const ProfileRailCard = ({ onNavigate }: ProfileRailCardProps) => {
  const { profile, roles } = useAuth();
  const { followerCount, followingCount } = useFollows();
  const role = roles[0]?.replace(/_/g, " ");

  return (
    <button
      type="button"
      onClick={() => onNavigate?.("profile")}
      className="group block w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-foreground/20"
    >
      {/* A cover strip gives the card a top edge and some colour without
          asking the member to upload anything. */}
      <div aria-hidden="true" className="h-9 bg-gradient-brand" />

      <div className="px-3.5 pb-3.5">
        <Avatar className="-mt-6 h-12 w-12 border-[3px] border-card">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-sm font-semibold">{initials(profile?.full_name)}</AvatarFallback>
        </Avatar>

        <p className="mt-2 truncate font-display text-[14px] font-semibold tracking-[-0.01em]">
          {profile?.full_name || "Your profile"}
        </p>
        <p className="mt-0.5 truncate text-[12px] capitalize text-muted-foreground">
          {profile?.headline || role || "Member"}
        </p>

        <dl className="mt-3 flex items-center gap-4 border-t border-border pt-2.5 text-[12px]">
          <div className="flex items-baseline gap-1.5">
            <dd className="font-semibold tabular-nums">{followerCount}</dd>
            <dt className="text-muted-foreground">Followers</dt>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dd className="font-semibold tabular-nums">{followingCount}</dd>
            <dt className="text-muted-foreground">Following</dt>
          </div>
        </dl>
      </div>
    </button>
  );
};

export default ProfileRailCard;
