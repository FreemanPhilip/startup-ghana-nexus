import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClaimRow {
  id: string;
  index_startup_id: string;
  member_startup_id: string;
  claimant_id: string;
  evidence: string | null;
  status: string;
  created_at: string;
  index_startup?: { name: string; slug: string | null } | null;
  claimant?: { full_name: string | null } | null;
}

const AdminClaimsQueue = () => {
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("index_claims")
      .select("*, index_startup:index_startups!index_claims_index_startup_id_fkey(name, slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const claimantIds = [...new Set((data || []).map((r: any) => r.claimant_id))];
    const { data: profs } = claimantIds.length
      ? await supabase.from("public_profiles").select("user_id, full_name").in("user_id", claimantIds)
      : { data: [] as any[] };
    const pMap = new Map((profs || []).map((p: any) => [p.user_id, p]));

    setRows((data || []).map((r: any) => ({ ...r, claimant: pMap.get(r.claimant_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase.from("index_claims").update({ status } as any).eq("id", id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Claim ${status}`);
    load();
  };

  if (loading) return <div className="text-muted-foreground">Loading claims…</div>;
  if (!rows.length) return <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No pending claims.</div>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{r.index_startup?.name || "Unknown startup"}</span>
                <Badge variant="outline" className="text-[10px]">Pending</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Claimed by {r.claimant?.full_name || "user"} · {new Date(r.created_at).toLocaleDateString()}
              </p>
              {r.evidence && <p className="mt-2 rounded bg-muted/50 p-2 text-sm">{r.evidence}</p>}
            </div>
            <div className="flex items-center gap-2">
              {r.index_startup?.slug && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/startups/${r.index_startup.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> View
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={() => decide(r.id, "approved")} disabled={busyId === r.id}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={() => decide(r.id, "rejected")} disabled={busyId === r.id}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminClaimsQueue;
