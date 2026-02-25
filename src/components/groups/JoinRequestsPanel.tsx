import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { JoinRequest } from "@/hooks/useGroupAdmin";

interface JoinRequestsPanelProps {
  requests: JoinRequest[];
  loading: boolean;
  onApprove: (requestId: string, userId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

const JoinRequestsPanel = ({ requests, loading, onApprove, onReject }: JoinRequestsPanelProps) => {
  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (requests.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No pending requests.</p>;

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={req.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs">{(req.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{req.full_name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{req.headline || "Member"}</p>
            {req.message && <p className="text-xs mt-1 text-foreground/80 italic">"{req.message}"</p>}
            <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => onApprove(req.id, req.user_id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onReject(req.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JoinRequestsPanel;
