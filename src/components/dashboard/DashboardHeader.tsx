import { Bell, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import AISearchChat from "./AISearchChat";

const DashboardHeader = () => {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <AISearchChat />

      <div className="flex items-center gap-3">
        {profile?.membership === "premium" && (
          <Badge className="bg-gradient-gold text-navy font-semibold gap-1.5">
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
