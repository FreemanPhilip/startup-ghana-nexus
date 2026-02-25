import { useState } from "react";
import { Star, Home, MessageSquare, Users, TrendingUp, Briefcase, UserPlus, LogOut, Upload, Menu, X, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import PitchDeckUploadDialog from "./PitchDeckUploadDialog";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open?: boolean;
  onClose?: () => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "network", label: "My Network", icon: Users },
  { id: "groups", label: "Groups", icon: UserPlus },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "mentors", label: "Mentors", icon: Star },
  { id: "investors", label: "Investors", icon: TrendingUp },
  { id: "opportunities", label: "Opportunities", icon: Briefcase },
];

const DashboardSidebar = ({ activeTab, onTabChange, open, onClose }: DashboardSidebarProps) => {
  const { profile, roles, signOut } = useAuth();
  const [pitchDeckOpen, setPitchDeckOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose?.();
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-4 w-4 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-lg font-bold">GSE Portal</span>
        </div>
        {/* Close button for mobile */}
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* User card */}
      <div className="border-b border-border px-4 py-4">
        <button
          onClick={() => handleTabChange("profile")}
          className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
        >
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
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
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
        <Button
          className="w-full bg-primary text-primary-foreground font-semibold gap-2 text-sm hover:opacity-90"
          onClick={() => setPitchDeckOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Pitch Deck Upload
        </Button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
      <PitchDeckUploadDialog open={pitchDeckOpen} onOpenChange={setPitchDeckOpen} />
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-60 flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-card shadow-xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;
