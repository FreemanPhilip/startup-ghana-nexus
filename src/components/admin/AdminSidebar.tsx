import { Star, LayoutDashboard, Users, Building2, FileText, Shield, BarChart3, LogOut, Menu, X, Briefcase, MessageSquare, UserPlus, ScrollText, Flag, DollarSign, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { canAccessTab, type AdminLevel, ADMIN_LEVELS } from "@/lib/adminPermissions";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open?: boolean;
  onClose?: () => void;
  adminLevel: AdminLevel;
}

const allNavItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "startups", label: "Startups", icon: Building2 },
  { id: "claims", label: "Claim Requests", icon: Flag },
  { id: "funding", label: "Funding Queue", icon: DollarSign },
  { id: "featured", label: "Featured", icon: Sparkles },
  { id: "opportunities", label: "Opportunities", icon: Briefcase },
  { id: "posts", label: "Posts", icon: MessageSquare },
  { id: "verification", label: "Verification", icon: Shield },
  { id: "contact", label: "Contact Forms", icon: FileText },
  { id: "invitations", label: "Admin Invites", icon: UserPlus },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

const AdminSidebar = ({ activeTab, onTabChange, open, onClose, adminLevel }: AdminSidebarProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = allNavItems.filter((item) => canAccessTab(adminLevel, item.id));
  const levelInfo = ADMIN_LEVELS.find((l) => l.value === adminLevel);

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "A";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onClose?.();
  };

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
            <Star className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <span className="font-display text-lg font-bold">Admin</span>
            <p className="text-[10px] text-muted-foreground leading-none">SparkX Index</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.full_name || "Admin"}</p>
            <Badge variant="outline" className={
              adminLevel === "super_admin" ? "bg-destructive/15 text-destructive border-destructive/30 text-[10px]" :
              adminLevel === "admin" ? "bg-primary/15 text-primary border-primary/30 text-[10px]" :
              "bg-muted text-muted-foreground text-[10px]"
            }>
              {levelInfo?.label || "Viewer"}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex h-full w-60 flex-col border-r border-border bg-card">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-card shadow-xl animate-in slide-in-from-left duration-300">{content}</aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
