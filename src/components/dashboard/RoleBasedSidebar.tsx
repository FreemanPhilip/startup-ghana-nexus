import { useState, useEffect, useCallback } from "react";
import {
  Star, Home, MessageSquare, Users, TrendingUp, Briefcase, UserPlus,
  LogOut, Upload, Menu, X, CalendarCheck, Settings, Search, BookmarkCheck,
  BarChart3, BookOpen, Clock, StarIcon, Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import PitchDeckUploadDialog from "./PitchDeckUploadDialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleBasedSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open?: boolean;
  onClose?: () => void;
  role: AppRole;
}

const founderNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "network", label: "My Network", icon: Users },
  { id: "groups", label: "Groups", icon: UserPlus },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "mentors", label: "Mentors", icon: StarIcon },
  { id: "my-sessions", label: "My Sessions", icon: CalendarCheck },
  { id: "investors", label: "Investors", icon: TrendingUp },
  { id: "opportunities", label: "Opportunities", icon: Briefcase },
  { id: "my-startups", label: "My Startups", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const investorNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover Startups", icon: Search },
  { id: "saved", label: "Saved Startups", icon: BookmarkCheck },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "portfolio", label: "Portfolio", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const mentorNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "my-sessions", label: "My Sessions", icon: CalendarCheck },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "reviews", label: "Reviews", icon: StarIcon },
  { id: "settings", label: "Settings", icon: Settings },
];

const partnerNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "programs", label: "Programs", icon: BookOpen },
  { id: "opportunities", label: "Opportunities", icon: Briefcase },
  { id: "startups", label: "Startups", icon: Building2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function getNavItems(role: AppRole) {
  switch (role) {
    case "startup_founder": return founderNav;
    case "investor": return investorNav;
    case "mentor": return mentorNav;
    case "ecosystem_partner": return partnerNav;
    default: return founderNav;
  }
}

const RoleBasedSidebar = ({ activeTab, onTabChange, open, onClose, role }: RoleBasedSidebarProps) => {
  const { profile, signOut, user } = useAuth();
  const [pitchDeckOpen, setPitchDeckOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const navigate = useNavigate();
  const navItems = getNavItems(role);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);
    if (!convos || convos.length === 0) { setTotalUnread(0); return; }
    const ids = convos.map(c => c.id);
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", ids)
      .neq("sender_id", user.id)
      .is("read_at", null);
    setTotalUnread(count ?? 0);
  }, [user]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  useEffect(() => {
    if (activeTab === "messages") {
      const timer = setTimeout(() => fetchUnreadCount(), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sidebar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchUnreadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUnreadCount]);

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

  const showPitchDeck = role === "startup_founder";

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-4 w-4 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-lg font-bold">The Index</span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

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
            <p className="truncate text-xs text-muted-foreground capitalize">
              {role.replace("_", " ")}
            </p>
          </div>
        </button>
      </div>

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
            <span className="flex-1 text-left">{item.label}</span>
            {item.id === "messages" && totalUnread > 0 && (
              <Badge className="h-5 min-w-5 rounded-full px-1.5 py-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-0">
                {totalUnread > 99 ? "99+" : totalUnread}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        {showPitchDeck && (
          <Button
            className="w-full bg-primary text-primary-foreground font-semibold gap-2 text-sm hover:opacity-90"
            onClick={() => setPitchDeckOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Pitch Deck Upload
          </Button>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
      {showPitchDeck && <PitchDeckUploadDialog open={pitchDeckOpen} onOpenChange={setPitchDeckOpen} />}
    </>
  );

  return (
    <>
      <aside className="hidden md:flex h-full w-60 flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>
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

export default RoleBasedSidebar;
