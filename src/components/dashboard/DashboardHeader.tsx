import { Bell, Settings, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const DashboardHeader = () => {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search startups, investors, or ecosystem news..."
          className="pl-10 bg-muted/50 border-0"
        />
      </div>

      {/* Right side */}
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
