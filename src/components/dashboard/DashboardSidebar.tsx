import { Star, Home, MessageSquare, Users, TrendingUp, Briefcase, UserPlus, LogOut, Settings, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "mentors", label: "Mentors", icon: Users },
  { id: "investors", label: "Investors", icon: TrendingUp },
  { id: "opportunities", label: "Opportunities", icon: Briefcase },
  { id: "team", label: "My Team", icon: UserPlus },
];

const DashboardSidebar = ({ activeTab, onTabChange }: DashboardSidebarProps) => {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
          <Star className="h-4 w-4 text-navy" fill="currentColor" />
        </div>
        <span className="font-display text-lg font-bold">AGS Portal</span>
      </div>

      {/* User card */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.full_name || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.industry || roles[0]?.replace("_", " ") || "Member"}
              {profile?.company_stage ? ` | ${profile.company_stage}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
