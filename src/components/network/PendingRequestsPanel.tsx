import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ConnectionRequest } from "@/hooks/useConnections";
import { useState } from "react";

interface PendingRequestsPanelProps {
  requests: ConnectionRequest[];
  loading: boolean;
  onAccept: (requestId: string) => Promise<boolean>;
  onReject: (requestId: string) => Promise<boolean>;
}

const PendingRequestsPanel = ({ requests, loading, onAccept, onReject }: PendingRequestsPanelProps) => {
  const [processing, setProcessing] = useState<string | null>(null);

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (requests.length === 0) return null;

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setProcessing(id);
    if (action === "accept") await onAccept(id);
    else await onReject(id);
    setProcessing(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Connection Requests ({requests.length})</h3>
      </div>
      {requests.map(req => {
        const profile = req.sender_profile;
        const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
        return (
          <div key={req.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{profile?.full_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.headline || profile?.company_name || "Ecosystem Member"}</p>
              {req.message && <p className="text-xs mt-1 text-foreground/80 italic">"{req.message}"</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                disabled={processing === req.id}
                onClick={() => handleAction(req.id, "accept")}
              >
                {processing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                disabled={processing === req.id}
                onClick={() => handleAction(req.id, "reject")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PendingRequestsPanel;
