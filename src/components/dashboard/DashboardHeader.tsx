import { Bell, Settings, CheckCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import AISearchChat from "./AISearchChat";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

const DashboardHeader = ({ onMenuToggle }: DashboardHeaderProps) => {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <AISearchChat />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {profile?.membership === "premium" && (
          <Badge className="hidden sm:flex bg-gradient-gold text-navy font-semibold gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            PREMIUM VERIFIED
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
