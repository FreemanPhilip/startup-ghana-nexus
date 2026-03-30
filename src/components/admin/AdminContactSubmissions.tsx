import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  company: string | null;
  message: string;
  created_at: string;
}

const AdminContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const filtered = submissions.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search submissions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={fetchSubmissions} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No contact submissions found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((sub) => (
              <div key={sub.id} className="hover:bg-muted/30 transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  className="w-full px-4 py-3 flex items-center gap-4 text-left"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{sub.name}</p>
                      {sub.company && <Badge variant="outline" className="text-[10px]">{sub.company}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{sub.subject}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(sub.created_at).toLocaleTimeString()}</p>
                  </div>
                  {expandedId === sub.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {expandedId === sub.id && (
                  <div className="px-4 pb-4 pl-16 space-y-2">
                    <div className="flex gap-4 text-xs">
                      <span className="text-muted-foreground">Email:</span>
                      <a href={`mailto:${sub.email}`} className="text-primary hover:underline">{sub.email}</a>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Message:</p>
                      <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{sub.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} submissions</p>
    </div>
  );
};

export default AdminContactSubmissions;
