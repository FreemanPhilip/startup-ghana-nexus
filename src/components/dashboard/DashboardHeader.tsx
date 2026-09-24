import { Settings, CheckCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import AISearchChat from "./AISearchChat";
import NotificationDropdown from "./NotificationDropdown";
import AvatarDropdown, { PostingIdentity } from "./AvatarDropdown";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  onNavigate: (tab: string) => void;
  onSignOut: () => void;
  activeIdentity: PostingIdentity;
  onIdentityChange: (identity: PostingIdentity) => void;
}

const DashboardHeader = ({ onMenuToggle, onNavigate, onSignOut, activeIdentity, onIdentityChange }: DashboardHeaderProps) => {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <AISearchChat />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {profile?.membership === "premium" && (
          <Badge
            variant="outline"
            className="hidden gap-1.5 border-brand/30 bg-brand/10 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand sm:flex"
          >
            <CheckCircle className="h-3 w-3" />
            Premium verified
          </Badge>
        )}
        <NotificationDropdown />
        <AvatarDropdown
          onNavigate={onNavigate}
          onSignOut={onSignOut}
          activeIdentity={activeIdentity}
          onIdentityChange={onIdentityChange}
        />
      </div>
    </header>
  );
};

export default DashboardHeader;
