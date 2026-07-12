import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoundRow {
  id: string;
  index_startup_id: string;
  round_type: string | null;
  amount_usd: number | null;
  announced_on: string | null;
  verified: boolean;
  created_at: string;
  index_startup?: { name: string; slug: string | null } | null;
}

const fmtUSD = (n: number | null) => (n == null ? "Undisclosed" : `$${Number(n).toLocaleString()}`);

const AdminFundingVerification = () => {
  const [rows, setRows] = useState<RoundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("index_funding_rounds")
      .select("*, index_startup:index_startups(name, slug)")
      .eq("verified", false)
      .order("created_at", { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setBusyId(id);
    const { error } = await (supabase as any).from("index_funding_rounds").update({ verified: true }).eq("id", id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Round verified");
    load();
  };

  const reject = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from("index_funding_rounds").delete().eq("id", id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Round removed");
    load();
  };

  if (loading) return <div className="text-muted-foreground">Loading funding rounds…</div>;
  if (!rows.length) return <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No funding rounds waiting for verification.</div>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold">{r.index_startup?.name || "Unknown"}</span>
                {r.round_type && <Badge variant="outline" className="text-[10px]">{r.round_type.replace(/_/g, " ")}</Badge>}
                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">Unverified</Badge>
              </div>
              <p className="text-sm">
                <span className="font-semibold">{fmtUSD(r.amount_usd)}</span>
                {r.announced_on && <span className="text-muted-foreground"> · Announced {new Date(r.announced_on).toLocaleDateString()}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => approve(r.id)} disabled={busyId === r.id}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={() => reject(r.id)} disabled={busyId === r.id}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminFundingVerification;
