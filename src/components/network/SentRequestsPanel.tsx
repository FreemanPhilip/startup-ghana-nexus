import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ConnectionRequest } from "@/hooks/useConnections";

interface SentRequestsPanelProps {
  requests: ConnectionRequest[];
  loading: boolean;
}

const SentRequestsPanel = ({ requests, loading }: SentRequestsPanelProps) => {
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Send className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-display text-lg font-bold">No Sent Requests</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Connection requests you send will appear here. Browse the network and start connecting!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Send className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Sent Requests ({requests.length})</h3>
      </div>
      {requests.map(req => {
        const profile = req.receiver_profile;
        const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
        return (
          <div key={req.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || "Unknown User"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.headline || profile?.company_name || "Ecosystem Member"}</p>
              {req.message && <p className="text-xs mt-1 text-foreground/70 italic line-clamp-1">"{req.message}"</p>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className="text-[10px] font-bold gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SentRequestsPanel;
