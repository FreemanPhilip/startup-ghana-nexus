import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";
import RoleBadge from "./RoleBadge";

interface Suggestion {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  role?: string | null;
}

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
        // role comes from the view rather than a second query against
        // user_roles: that table is readable only by its owner, so the old
        // lookup returned nothing for other people and every suggestion fell
        // into one bucket — the diversification below never diversified.
        .select("user_id, full_name, avatar_url, headline, roles")
        .not("user_id", "in", `(${[...followedIds].join(",")})`)
        .limit(12);

      if (!profiles || profiles.length === 0) {
        setSuggestions([]);
        return;
      }

      // One role per person is enough to spread the suggestions out; the
      // array is ordered, so the choice is stable between renders.
      const roleMap = new Map(profiles.map(p => [p.user_id, p.roles?.[0] ?? null]));

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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
        <h3 className="text-sm font-semibold">People to follow</h3>
      </div>

      {/* Rows, not a three-across grid of stacked captions. A name, what they
          do, and one action — the same shape as every follow list people
          already know how to read. */}
      <ul className="divide-y divide-border">
        {suggestions.map((s) => {
          const initials = (s.full_name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          const following = isFollowing(s.user_id);
          return (
            <li key={s.user_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={s.avatar_url || undefined} alt="" />
                <AvatarFallback className="bg-muted text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold">{s.full_name || "Member"}</p>
                  <RoleBadge role={s.role} variant="inline" />
                </div>
                <p className="truncate text-[12px] text-muted-foreground">{s.headline || "Member"}</p>
              </div>

              <Button
                variant={following ? "ghost" : "outline"}
                size="sm"
                className="h-8 shrink-0 rounded-full px-4 text-[13px] font-medium"
                onClick={() => toggleFollow(s.user_id)}
              >
                {following ? "Following" : "Follow"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecommendedConnections;
