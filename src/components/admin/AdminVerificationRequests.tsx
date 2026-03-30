import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/auditLog";
import { canPerformAction, type AdminLevel } from "@/lib/adminPermissions";

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  document_url: string | null;
  linkedin_url: string | null;
  additional_info: string | null;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; headline: string | null };
}

interface AdminVerificationRequestsProps {
  adminLevel: AdminLevel;
}

const AdminVerificationRequests = ({ adminLevel }: AdminVerificationRequestsProps) => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, headline").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      setRequests(data.map((r) => ({ ...r, profile: profileMap.get(r.user_id) || undefined })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (req: VerificationRequest, action: "verified" | "rejected") => {
    await supabase.from("verification_requests").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", req.id);
    if (action === "verified") {
      await supabase.from("profiles").update({ verification: "verified" }).eq("user_id", req.user_id);
    }
    if (user) {
      logAdminAction(user.id, "verification_update", "user", req.user_id, {
        target_name: req.profile?.full_name,
        status: action,
        request_id: req.id,
      });
    }
    toast({ title: `Request ${action}`, description: `Verification request has been ${action}.` });
    fetchRequests();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No verification requests</div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((req) => (
              <div key={req.id} className="p-4 flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={req.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-xs">{req.profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{req.profile?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{req.profile?.headline || "—"}</p>
                  {req.additional_info && <p className="text-xs text-muted-foreground mt-1">{req.additional_info}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {req.linkedin_url && (
                      <a href={req.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                    {req.document_url && (
                      <a href={req.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Document
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={
                    req.status === "pending" ? "bg-secondary/15 text-secondary border-secondary/30" :
                    req.status === "approved" || req.status === "verified" ? "bg-primary/15 text-primary border-primary/30" :
                    "bg-destructive/15 text-destructive border-destructive/30"
                  }>{req.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                  {req.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-primary border-primary/30" onClick={() => handleAction(req, "verified")}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30" onClick={() => handleAction(req, "rejected")}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationRequests;
