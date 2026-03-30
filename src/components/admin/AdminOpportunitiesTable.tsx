import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Briefcase } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  type: string;
  organization: string;
  amount: string | null;
  deadline: string | null;
  is_featured: boolean | null;
  created_at: string;
}

const AdminOpportunitiesTable = () => {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("opportunities").select("id, title, type, organization, amount, deadline, is_featured, created_at").order("created_at", { ascending: false });
      setOpps(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = opps.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search opportunities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opportunity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No opportunities found</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-accent shrink-0" />
                      <span className="font-medium">{o.title}</span>
                      {o.is_featured && <Badge className="bg-secondary/15 text-secondary border-secondary/30 text-[10px]">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{o.type}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{o.organization}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.amount || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{o.deadline ? new Date(o.deadline).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {opps.length} opportunities</p>
    </div>
  );
};

export default AdminOpportunitiesTable;
