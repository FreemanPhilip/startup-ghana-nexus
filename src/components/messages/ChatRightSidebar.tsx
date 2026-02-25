import { MapPin, Briefcase, Clock, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/hooks/useMessages";
import { format } from "date-fns";

interface ChatRightSidebarProps {
  conversation: Conversation | undefined;
}

const ChatRightSidebar = ({ conversation }: ChatRightSidebarProps) => {
  if (!conversation?.other_user) return null;

  const other = conversation.other_user;
  const initials = other.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <aside className="hidden lg:flex w-72 flex-col border-l border-border bg-card overflow-y-auto">
      {/* Profile card */}
      <div className="flex flex-col items-center p-6 border-b border-border">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={other.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          {other.verification === "verified" && (
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary border-2 border-card" />
          )}
        </div>
        <h3 className="mt-3 font-display text-base font-bold">{other.full_name}</h3>
        <p className="text-xs text-muted-foreground text-center mt-0.5">
          {other.headline || `${other.industry || "Professional"}${other.company_name ? ` @ ${other.company_name}` : ""}`}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" className="text-xs">View Profile</Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Star className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Context */}
      <div className="p-5 border-b border-border space-y-4">
        <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Context</h4>

        {other.location && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Location</p>
              <p className="text-xs text-muted-foreground">{other.location}</p>
            </div>
          </div>
        )}

        {other.expertise && other.expertise.length > 0 && (
          <div className="flex items-start gap-3">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Interests</p>
              <p className="text-xs text-muted-foreground">{other.expertise.join(", ")}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Connected Since</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(conversation.created_at), "MMMM yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Premium benefit */}
      <div className="p-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-gradient-gold text-navy text-[10px] font-semibold px-2 py-0.5">
              PREMIUM BENEFIT
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unlimited messaging to investors and high-priority reply tracking is active.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default ChatRightSidebar;
