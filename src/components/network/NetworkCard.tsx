import { UserPlus, UserCheck, MapPin, BadgeCheck, Building2, MessageSquare, Clock, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NetworkProfile } from "@/hooks/useNetwork";

interface NetworkCardProps {
  profile: NetworkProfile;
  isFollowing: boolean;
  connectionStatus: "none" | "pending_sent" | "pending_received" | "connected";
  onToggleFollow: (userId: string) => void;
  onConnect?: (userId: string) => void;
  onAcceptRequest?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const roleLabelMap: Record<string, string> = {
  startup_founder: "Founder",
  investor: "Investor",
  mentor: "Mentor",
  ecosystem_partner: "Partner",
  service_provider: "Service Provider",
  admin: "Admin",
  member: "Member",
};

const NetworkCard = ({ profile, isFollowing, connectionStatus, onToggleFollow, onConnect, onAcceptRequest, onMessage, onViewProfile }: NetworkCardProps) => {
  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const renderConnectButton = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs font-semibold" disabled>
            <UserCheck className="h-3.5 w-3.5" />
            Connected
          </Button>
        );
      case "pending_sent":
        return (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs font-semibold text-muted-foreground" disabled>
            <Clock className="h-3.5 w-3.5" />
            Pending
          </Button>
        );
      case "pending_received":
        return (
          <Button
            size="sm"
            variant="default"
            className="flex-1 gap-1.5 text-xs font-semibold"
            onClick={() => onAcceptRequest?.(profile.user_id)}
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="default"
            className="flex-1 gap-1.5 text-xs font-semibold"
            onClick={() => onConnect?.(profile.user_id)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Connect
          </Button>
        );
    }
  };

  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-shadow hover:shadow-md cursor-pointer h-full" onClick={() => onViewProfile?.(profile.user_id)}>
      <Avatar className="h-16 w-16">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
      </Avatar>

      <div className="mt-3 flex items-center gap-1">
        <h3 className="text-sm font-bold truncate max-w-[160px]">{profile.full_name || "Anonymous"}</h3>
        {profile.verification === "verified" && (
          <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
        )}
      </div>

      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
        {profile.headline || profile.industry || "Ecosystem Member"}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted-foreground">
        {profile.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {profile.location}
          </span>
        )}
        {profile.company_name && (
          <span className="flex items-center gap-0.5">
            <Building2 className="h-3 w-3" />
            {profile.company_name}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1">
        {profile.roles.map((role) => (
          <Badge key={role} variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
            {roleLabelMap[role] || role}
          </Badge>
        ))}
      </div>

      {profile.expertise && profile.expertise.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {profile.expertise.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 flex w-full gap-2" onClick={e => e.stopPropagation()}>
        {renderConnectButton()}
        {(connectionStatus === "connected") && onMessage && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs"
            onClick={() => onMessage(profile.user_id)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NetworkCard;
