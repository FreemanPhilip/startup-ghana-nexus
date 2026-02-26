import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface OutreachRequest {
  id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  receiver_profile?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    company_name: string | null;
  };
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  accepted: { label: "Accepted", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  rejected: { label: "Declined", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const OutreachHistoryTab = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<OutreachRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOutreach = async () => {
      setLoading(true);

      // Get all connection requests sent by the current user
      const { data } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const receiverIds = [...new Set(data.map(r => r.receiver_id))];

      // Get profiles of receivers
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headline, company_name")
        .in("user_id", receiverIds);

      // Get user_roles to find which receivers are investors
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", receiverIds)
        .eq("role", "investor");

      const investorIds = new Set(roles?.map(r => r.user_id) ?? []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      // Only keep requests sent to investors
      const investorRequests = data
        .filter(r => investorIds.has(r.receiver_id))
        .map(r => ({
          ...r,
          receiver_profile: profileMap.get(r.receiver_id),
        }));

      setRequests(investorRequests);
      setLoading(false);
    };

    fetchOutreach();

    const channel = supabase
      .channel(`outreach-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "connection_requests", filter: `sender_id=eq.${user.id}` }, () => {
        fetchOutreach();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Send className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-display text-lg font-bold">No Investor Outreach Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Connection requests you send to investors will appear here with their status.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const profile = req.receiver_profile;
        const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
        const config = statusConfig[req.status] || statusConfig.pending;
        const StatusIcon = config.icon;

        return (
          <div key={req.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || "Unknown User"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.headline || profile?.company_name || "Investor"}</p>
              {req.message && <p className="text-xs mt-1 text-foreground/70 italic line-clamp-1">"{req.message}"</p>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${config.className}`}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
              </p>
              {req.responded_at && (
                <p className="text-[10px] text-muted-foreground">
                  Replied {format(new Date(req.responded_at), "MMM d")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OutreachHistoryTab;
