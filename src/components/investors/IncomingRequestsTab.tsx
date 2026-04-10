import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check, X, Loader2, Inbox, Clock, CheckCircle2, XCircle,
  MessageSquare, UserPlus, Users, Filter, Shield, FileText, Download
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface FullRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    company_name: string | null;
    industry: string | null;
    location: string | null;
  };
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  accepted: { label: "Accepted", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  rejected: { label: "Declined", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const IncomingRequestsTab = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("connection_requests")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const senderIds = [...new Set(data.map(r => r.sender_id))];
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("user_id, full_name, avatar_url, headline, company_name, industry, location")
      .in("user_id", senderIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    setRequests(data.map(r => ({
      ...r,
      sender_profile: profileMap.get(r.sender_id),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`incoming-requests-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "connection_requests",
        filter: `receiver_id=eq.${user.id}`,
      }, () => { fetchRequests(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRequests]);

  const handleAccept = async (req: FullRequest) => {
    setProcessing(req.id);
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", req.id)
      .eq("receiver_id", user!.id);

    if (!error) {
      toast({
        title: "Connection Accepted ✅",
        description: `You are now connected with ${req.sender_profile?.full_name || "this user"}. You can now message each other.`,
      });
      fetchRequests();
    }
    setProcessing(null);
  };

  const handleReject = async (req: FullRequest) => {
    setProcessing(req.id);
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", req.id)
      .eq("receiver_id", user!.id);

    if (!error) {
      toast({
        title: "Request Declined",
        description: `You declined ${req.sender_profile?.full_name || "this user"}'s connection request.`,
      });
      fetchRequests();
    }
    setProcessing(null);
  };

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    accepted: requests.filter(r => r.status === "accepted").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  }), [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter("all")}>
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{counts.all}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter("pending")}>
          <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{counts.pending}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter("accepted")}>
          <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{counts.accepted}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Accepted</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter("rejected")}>
          <XCircle className="h-5 w-5 mx-auto text-destructive mb-1" />
          <p className="text-2xl font-bold">{counts.rejected}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Declined</p>
        </Card>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {(["all", "pending", "accepted", "rejected"] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className="text-xs h-7 px-3 capitalize"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Requests" : f === "rejected" ? "Declined" : f}
          </Button>
        ))}
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-display text-lg font-bold">
            {filter === "all" ? "No Connection Requests Yet" : `No ${filter === "rejected" ? "Declined" : filter} Requests`}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === "all"
              ? "When founders or other users send you a connection request, it will appear here."
              : `You have no ${filter === "rejected" ? "declined" : filter} connection requests.`}
          </p>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3 pr-2">
            {filtered.map(req => {
              const profile = req.sender_profile;
              const name = profile?.full_name || "Unknown User";
              const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              const config = statusConfig[req.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isPending = req.status === "pending";

              return (
                <div
                  key={req.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border bg-card p-4 transition-all ${
                    isPending ? "border-primary/30 shadow-sm" : "border-border"
                  }`}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{name}</p>
                      <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${config.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {[profile?.headline, profile?.company_name, profile?.industry, profile?.location]
                        .filter(Boolean).join(" · ") || "Ecosystem Member"}
                    </p>
                    {req.message && (() => {
                      // Extract pitch deck URL and clean message
                      const deckMatch = req.message.match(/\[Pitch Deck:\s*(https?:\/\/[^\]]+)\]/);
                      const pitchDeckUrl = deckMatch?.[1] || null;
                      const cleanMessage = req.message
                        .replace(/\[Pitch Deck:\s*https?:\/\/[^\]]+\]\s*/g, "")
                        .replace(/\[Intro Request[^\]]*\]\s*/g, "")
                        .trim();

                      return (
                        <>
                          {cleanMessage && (
                            <div className="flex items-start gap-1.5 mt-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                              <p className="text-xs text-foreground/80 italic line-clamp-2">"{cleanMessage}"</p>
                            </div>
                          )}
                          {pitchDeckUrl && (
                            <a
                              href={pitchDeckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                              onClick={e => e.stopPropagation()}
                            >
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-medium text-primary">View Pitch Deck</span>
                              <Download className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>Received {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</span>
                      {req.responded_at && (
                        <span>· Responded {format(new Date(req.responded_at), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 shrink-0 sm:flex-col">
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs font-semibold flex-1 sm:flex-none"
                        disabled={processing === req.id}
                        onClick={() => handleAccept(req)}
                      >
                        {processing === req.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs font-semibold flex-1 sm:flex-none"
                        disabled={processing === req.id}
                        onClick={() => handleReject(req)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Security note */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
        <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong>Privacy & Security:</strong> Only accepted connections can send you direct messages. 
          Declined requests are archived and the sender will not be notified of a decline. 
          You can manage your connection preferences anytime.
        </p>
      </div>
    </div>
  );
};

export default IncomingRequestsTab;
