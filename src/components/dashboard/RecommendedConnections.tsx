import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
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
}

const RecommendedConnections = () => {
  const { user } = useAuth();
  const { toggleFollow, isFollowing } = useFollows();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get users the current user already follows
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followedIds = new Set(follows?.map(f => f.following_id) || []);
      followedIds.add(user.id);

      // Get profiles not yet followed
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headline")
        .not("user_id", "in", `(${[...followedIds].join(",")})`)
        .limit(6);

      setSuggestions(profiles || []);
    };
    fetch();
  }, [user]);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Suggested Connections</h3>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {suggestions.slice(0, 3).map(s => {
          const initials = (s.full_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const following = isFollowing(s.user_id);
          return (
            <div key={s.user_id} className="flex flex-col items-center rounded-lg border border-border p-4 text-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={s.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <p className="mt-2 text-xs font-semibold leading-tight truncate w-full">{s.full_name || "Unknown"}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground truncate w-full">{s.headline || "Member"}</p>
              <Button
                variant={following ? "outline" : "outline"}
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
