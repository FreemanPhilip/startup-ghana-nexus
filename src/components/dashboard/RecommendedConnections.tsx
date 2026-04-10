import { useState, useEffect } from "react";
import { Sparkles, Rocket, TrendingUp, GraduationCap, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";

interface Suggestion {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  role?: string | null;
}

const roleConfig: Record<string, { label: string; className: string; icon: any }> = {
  startup_founder: { label: "Founder", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Rocket },
  investor: { label: "Investor", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: TrendingUp },
  mentor: { label: "Mentor", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: GraduationCap },
  ecosystem_partner: { label: "Partner", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Handshake },
};

const RecommendedConnections = () => {
  const { user } = useAuth();
  const { toggleFollow, isFollowing } = useFollows();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      // Get users the current user already follows
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followedIds = new Set(follows?.map(f => f.following_id) || []);
      followedIds.add(user.id);

      // Get profiles not yet followed
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, full_name, avatar_url, headline")
        .not("user_id", "in", `(${[...followedIds].join(",")})`)
        .limit(12);

      if (!profiles || profiles.length === 0) {
        setSuggestions([]);
        return;
      }

      // Fetch roles for these users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      // Diversify: pick at most 1 from each role, then fill remaining
      const byRole = new Map<string, Suggestion[]>();
      const enriched = profiles.map(p => ({ ...p, role: roleMap.get(p.user_id) || null }));
      
      enriched.forEach(p => {
        const r = p.role || "unknown";
        if (!byRole.has(r)) byRole.set(r, []);
        byRole.get(r)!.push(p);
      });

      const picked: Suggestion[] = [];
      const usedIds = new Set<string>();

      // One from each role first
      for (const [, members] of byRole) {
        if (picked.length >= 3) break;
        if (members.length > 0) {
          const pick = members[0];
          picked.push(pick);
          usedIds.add(pick.user_id);
        }
      }

      // Fill remaining slots
      for (const p of enriched) {
        if (picked.length >= 3) break;
        if (!usedIds.has(p.user_id)) {
          picked.push(p);
          usedIds.add(p.user_id);
        }
      }

      setSuggestions(picked);
    };
    fetchSuggestions();

    // Real-time: refresh when new profiles are created
    const channel = supabase
      .channel("new-profiles-sync")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        fetchSuggestions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">People in the Ecosystem</h3>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {suggestions.map(s => {
          const initials = (s.full_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const following = isFollowing(s.user_id);
          const config = s.role ? roleConfig[s.role] : null;
          const RoleIcon = config?.icon;
          return (
            <div key={s.user_id} className="flex flex-col items-center rounded-lg border border-border p-4 text-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={s.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <p className="mt-2 text-xs font-semibold leading-tight truncate w-full">{s.full_name || "Unknown"}</p>
              {config && (
                <span className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${config.className}`}>
                  {RoleIcon && <RoleIcon className="h-2 w-2" />}
                  {config.label}
                </span>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground truncate w-full">{s.headline || "Member"}</p>
              <Button
                variant="outline"
                size="sm"
                className={`mt-3 h-7 w-full text-xs ${following ? "" : "text-primary border-primary hover:bg-primary/5"}`}
                onClick={() => toggleFollow(s.user_id)}
              >
                {following ? "Following" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedConnections;
