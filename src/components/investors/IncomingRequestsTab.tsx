import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useConnections, type ConnectionRequest } from "@/hooks/useConnections";
import { toast } from "@/hooks/use-toast";

const IncomingRequestsTab = () => {
  const { pendingReceived, loading, acceptRequest, rejectRequest } = useConnections();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (id: string, action: "accept" | "reject", name: string) => {
    setProcessing(id);
    const success = action === "accept" ? await acceptRequest(id) : await rejectRequest(id);
    if (success) {
      toast({
        title: action === "accept" ? "Connection Accepted" : "Request Declined",
        description: action === "accept"
          ? `You are now connected with ${name}.`
          : `You declined ${name}'s request.`,
      });
    }
    setProcessing(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (pendingReceived.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-display text-lg font-bold">No Pending Requests</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          When founders or other users send you a connection request, it will appear here for you to accept or decline.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pendingReceived.map(req => {
        const profile = req.sender_profile;
        const name = profile?.full_name || "Unknown";
        const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

        return (
          <div key={req.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.headline || profile?.company_name || "Ecosystem Member"}</p>
              {req.message && <p className="text-xs mt-1 text-foreground/70 italic line-clamp-1">"{req.message}"</p>}
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                className="gap-1 text-xs font-semibold"
                disabled={processing === req.id}
                onClick={() => handleAction(req.id, "accept", name)}
              >
                {processing === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs font-semibold"
                disabled={processing === req.id}
                onClick={() => handleAction(req.id, "reject", name)}
              >
                <X className="h-3.5 w-3.5" />
                Decline
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IncomingRequestsTab;
