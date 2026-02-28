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
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
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
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Active Members</h3>
            <p className="text-[10px] text-muted-foreground">{onlineCount} online now</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {members.map(m => {
          const initials = (m.full_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const RoleIcon = m.role ? roleIcons[m.role] : null;
          const roleColor = m.role ? roleColors[m.role] : "";

          return (
            <div key={m.user_id} className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/50 transition-colors">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                {m.is_online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{m.full_name}</p>
                <div className="flex items-center gap-1">
                  {RoleIcon && <RoleIcon className={`h-2.5 w-2.5 ${roleColor}`} />}
                  <span className="text-[10px] text-muted-foreground">
                    {m.is_online ? "Online" : "Recently active"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ActiveMembers;
