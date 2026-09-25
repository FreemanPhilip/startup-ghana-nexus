import { useState, useEffect, useCallback } from "react";
import {
  Home, MessageSquare, Users, TrendingUp, Briefcase, UserPlus,
  LogOut, Upload, Menu, X, CalendarCheck, Settings, Search, BookmarkCheck,
  BarChart3, BookOpen, Clock, StarIcon, Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tabAccent } from "@/lib/categoryAccents";
import ProfileRailCard from "./ProfileRailCard";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SparkXLogo from "@/components/SparkXLogo";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import PitchDeckUploadDialog from "./PitchDeckUploadDialog";
import type { Database } from "@/integrations/supabase/types";
import { LANDING_PATH } from "@/lib/roleRouting";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleBasedSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open?: boolean;
  onClose?: () => void;
  role: AppRole;
}

/**
 * Navigation, grouped.
 *
 * The founder rail was eleven destinations in one flat list with no
 * relationship between them, so finding anything meant reading all eleven.
 * Same destinations, same ids — routing is untouched — but gathered under the
 * job they belong to, which is how a member actually thinks about them.
 *
 * Settings moved to the footer: it is not a place you go, it is somewhere you
 * end up, and it already sits in the profile menu too.
 */
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const founderNav: NavGroup[] = [
  { items: [
    { id: "home", label: "Home", icon: Home },
    { id: "network", label: "My Network", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "groups", label: "Groups", icon: UserPlus },
  ] },
  { label: "Mentorship", items: [
    { id: "mentors", label: "Mentors", icon: StarIcon },
    { id: "mentor-briefing", label: "Briefing", icon: CalendarCheck },
    { id: "my-sessions", label: "Sessions", icon: CalendarCheck },
  ] },
  { label: "Growth", items: [
    { id: "my-startups", label: "My Startups", icon: Building2 },
    { id: "investors", label: "Investors", icon: TrendingUp },
    { id: "opportunities", label: "Opportunities", icon: Briefcase },
  ] },
];

const investorNav: NavGroup[] = [
  { items: [
    { id: "home", label: "Home", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ] },
  { label: "Deal flow", items: [
    { id: "discover", label: "Discover", icon: Search },
    { id: "saved", label: "Saved", icon: BookmarkCheck },
    { id: "portfolio", label: "Portfolio", icon: BarChart3 },
  ] },
];

const mentorNav: NavGroup[] = [
  { items: [
    { id: "home", label: "Home", icon: Home },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ] },
  { label: "Mentorship", items: [
    { id: "mentees", label: "Mentees", icon: Users },
    { id: "my-sessions", label: "Sessions", icon: CalendarCheck },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "reviews", label: "Reviews", icon: StarIcon },
  ] },
];

const partnerNav: NavGroup[] = [
  { items: [
    { id: "home", label: "Home", icon: Home },
  ] },
  { label: "Programmes", items: [
    { id: "programs", label: "Programs", icon: BookOpen },
    { id: "opportunities", label: "Opportunities", icon: Briefcase },
    { id: "startups", label: "Startups", icon: Building2 },
  ] },
  { label: "Insight", items: [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ] },
];

function getNavItems(role: AppRole): NavGroup[] {
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
  const navGroups = getNavItems(role);

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
        <Link to={LANDING_PATH} aria-label="SparkX home" className="flex items-center">
          <SparkXLogo className="h-7" />
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-3 pb-2 pt-3">
        <ProfileRailCard onNavigate={handleTabChange} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
        {navGroups.map((group, gi) => (
          <div key={group.label ?? `g${gi}`} className={gi > 0 ? "mt-4" : ""}>
            {group.label && (
              <p className="px-3 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {/* Each domain keeps its hue, so the rail can be scanned
                        by colour rather than read top to bottom. */}
                    <item.icon className={`h-4 w-4 ${active ? `${tabAccent(item.id)} accent-text` : ""}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === "messages" && totalUnread > 0 && (
                      <Badge className="flex h-5 min-w-5 items-center justify-center rounded-full border-0 bg-destructive px-1.5 py-0 text-[10px] text-destructive-foreground">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border p-3">
        {showPitchDeck && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-lg text-[13px] font-medium"
            onClick={() => setPitchDeckOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            Pitch Deck
          </Button>
        )}
        <button
          onClick={() => handleTabChange("settings")}
          aria-current={activeTab === "settings" ? "page" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            activeTab === "settings"
              ? "bg-muted font-medium text-foreground"
              : "font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
