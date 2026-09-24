import { useState, useEffect } from "react";
import { Users, Rocket, TrendingUp, GraduationCap, Handshake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ActiveMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
  role?: string | null;
}

const roleIcons: Record<string, any> = {
  startup_founder: Rocket,
  investor: TrendingUp,
  mentor: GraduationCap,
  ecosystem_partner: Handshake,
};

const roleColors: Record<string, string> = {
  startup_founder: "text-emerald-500",
  investor: "text-blue-500",
  mentor: "text-purple-500",
  ecosystem_partner: "text-amber-500",
};

const ActiveMembers = () => {
  const [members, setMembers] = useState<ActiveMember[]>([]);

  const fetchMembers = async () => {
    // Get recently active users
    const { data: presence } = await supabase
      .from("user_presence")
      .select("user_id, is_online, last_seen")
      .order("last_seen", { ascending: false })
      .limit(20);

    if (!presence || presence.length === 0) return;

    const userIds = presence.map(p => p.user_id);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("public_profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const roleMap = new Map((rolesRes.data || []).map(r => [r.user_id, r.role]));

    const enriched: ActiveMember[] = presence
      .map(p => {
        const profile = profileMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          is_online: p.is_online,
          role: roleMap.get(p.user_id) || null,
        };
      })
      .filter(m => m.full_name); // Only show users with profiles

    setMembers(enriched.slice(0, 8));
  };

  useEffect(() => {
    fetchMembers();

    // Real-time presence updates
    const channel = supabase
      .channel("active-members-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (members.length === 0) return null;

  const onlineCount = members.filter(m => m.is_online).length;

  return (
    /**
     * Presence, as faces.
     *
     * This was an eight-row list of avatar + name + "Online", sitting
     * directly under another eight-row list of avatar + name + headline.
     * Two identical structures answering different questions read as the
     * same module twice. Who is around is a glanceable fact, so it is a row
     * of faces and a count — the list shape belongs to the one module that
     * needs a per-person action.
     */
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">Around now</h3>
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden="true" />
          <span className="tabular-nums">{onlineCount}</span>
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {members.map((m) => {
          const initials = (m.full_name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          return (
            <li key={m.user_id} className="relative" title={`${m.full_name ?? "Member"}${m.is_online ? " · online" : ""}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.avatar_url || undefined} alt="" />
                <AvatarFallback className="bg-muted text-[10px] font-semibold">{initials}</AvatarFallback>
              </Avatar>
              {m.is_online && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald"
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">
                {m.full_name} {m.is_online ? "online" : "recently active"}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default ActiveMembers;
