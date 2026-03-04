import { useState } from "react";
import { User, Building2, SwitchCamera, Settings, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useStartups, Startup } from "@/hooks/useStartups";

export interface PostingIdentity {
  type: "personal" | "startup";
  startup?: Startup & { member_count: number; my_role: string };
}

interface AvatarDropdownProps {
  onNavigate: (tab: string) => void;
  onSignOut: () => void;
  activeIdentity: PostingIdentity;
  onIdentityChange: (identity: PostingIdentity) => void;
}

const AvatarDropdown = ({ onNavigate, onSignOut, activeIdentity, onIdentityChange }: AvatarDropdownProps) => {
  const { profile, primaryRole } = useAuth();
  const { myStartups } = useStartups();
  const hideStartups = primaryRole === "mentor" || primaryRole === "investor";

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const currentAvatar = activeIdentity.type === "startup" ? activeIdentity.startup?.logo_url : profile?.avatar_url;
  const currentName = activeIdentity.type === "startup" ? activeIdentity.startup?.name : profile?.full_name;
  const currentFallback = activeIdentity.type === "startup"
    ? (activeIdentity.startup?.name?.charAt(0) || "S")
    : initials;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-muted p-1 pr-2 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{currentFallback}</AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{profile?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.headline || profile?.industry || "Member"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onNavigate("profile")} className="gap-2 cursor-pointer">
          <User className="h-4 w-4" /> View Profile
        </DropdownMenuItem>
        {!hideStartups && (
          <DropdownMenuItem onClick={() => onNavigate("my-startups")} className="gap-2 cursor-pointer">
            <Building2 className="h-4 w-4" /> My Startups
          </DropdownMenuItem>
        )}

        {/* Identity switching */}
        {myStartups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
              <SwitchCamera className="h-3 w-3" /> Switch Identity
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onIdentityChange({ type: "personal" })}
              className={`gap-2 cursor-pointer ${activeIdentity.type === "personal" ? "bg-primary/5" : ""}`}
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[9px] font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{profile?.full_name || "Personal"}</span>
              {activeIdentity.type === "personal" && <span className="ml-auto text-xs text-primary">Active</span>}
            </DropdownMenuItem>
            {myStartups.filter(s => ["owner", "admin", "editor"].includes(s.my_role)).map(startup => (
              <DropdownMenuItem
                key={startup.id}
                onClick={() => onIdentityChange({ type: "startup", startup })}
                className={`gap-2 cursor-pointer ${activeIdentity.type === "startup" && activeIdentity.startup?.id === startup.id ? "bg-primary/5" : ""}`}
              >
                <Avatar className="h-5 w-5 rounded">
                  <AvatarImage src={startup.logo_url || undefined} />
                  <AvatarFallback className="text-[9px] font-bold rounded">{startup.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{startup.name}</span>
                {activeIdentity.type === "startup" && activeIdentity.startup?.id === startup.id && (
                  <span className="ml-auto text-xs text-primary">Active</span>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNavigate("settings")} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut} className="gap-2 cursor-pointer text-destructive">
          <LogOut className="h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarDropdown;
