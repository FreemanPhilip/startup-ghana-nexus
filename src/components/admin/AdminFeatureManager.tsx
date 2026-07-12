import { useEffect, useMemo, useState } from "react";
import { Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StartupRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  sector: string | null;
  sparkx_score: number | null;
  is_featured: boolean;
}

const AdminFeatureManager = () => {
  const [rows, setRows] = useState<StartupRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("index_startups")
      .select("id, name, slug, logo_url, sector, sparkx_score, is_featured")
      .order("is_featured", { ascending: false })
      .order("sparkx_score", { ascending: false })
      .limit(100);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const featuredCount = useMemo(() => rows.filter((r) => r.is_featured).length, [rows]);
  const filtered = useMemo(
    () => rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const toggle = async (row: StartupRow) => {
    if (!row.is_featured && featuredCount >= 3) {
      toast.error("You can feature up to 3 startups. Unfeature one first.");
      return;
    }
    setBusy(row.id);
    const { error } = await supabase
      .from("index_startups")
      .update({ is_featured: !row.is_featured } as any)
      .eq("id", row.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(row.is_featured ? "Unfeatured" : "Featured");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{featuredCount}/3</span> featured this week
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search startups…" className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="h-9 w-9 shrink-0 rounded bg-muted overflow-hidden flex items-center justify-center font-bold text-xs">
                {r.logo_url ? <img src={r.logo_url} alt="" className="h-full w-full object-cover" /> : r.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{r.name}</span>
                  {r.is_featured && <Badge className="bg-primary text-primary-foreground text-[10px]"><Star className="h-3 w-3 mr-1" fill="currentColor" />Featured</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.sector?.replace(/_/g, " ") || "—"} · SparkX {Math.round(Number(r.sparkx_score) || 0)}
                </div>
              </div>
              <Button
                variant={r.is_featured ? "outline" : "default"}
                size="sm"
                onClick={() => toggle(r)}
                disabled={busy === r.id}
              >
                {r.is_featured ? "Unfeature" : "Feature"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeatureManager;
