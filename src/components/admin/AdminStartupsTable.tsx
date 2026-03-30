import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Building2 } from "lucide-react";

interface Startup {
  id: string;
  name: string;
  industry: string | null;
  stage: string | null;
  location: string | null;
  verification_status: string;
  created_at: string;
}

const AdminStartupsTable = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("startups").select("id, name, industry, stage, location, verification_status, created_at").order("created_at", { ascending: false });
      setStartups(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = startups.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search startups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Startup</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Industry</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No startups found</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.industry || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{s.stage || "—"}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{s.location || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={
                      s.verification_status === "verified" ? "bg-primary/15 text-primary border-primary/30" :
                      s.verification_status === "pending" ? "bg-secondary/15 text-secondary border-secondary/30" :
                      ""
                    }>{s.verification_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {startups.length} startups</p>
    </div>
  );
};

export default AdminStartupsTable;
