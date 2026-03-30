import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Shield, UserCog, KeyRound, UserPlus, Trash2, Activity } from "lucide-react";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface AdminProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  role_change: { label: "Role Change", icon: <UserCog className="h-3.5 w-3.5" />, color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  password_reset: { label: "Password Reset", icon: <KeyRound className="h-3.5 w-3.5" />, color: "bg-destructive/15 text-destructive border-destructive/30" },
  admin_invite: { label: "Admin Invite", icon: <UserPlus className="h-3.5 w-3.5" />, color: "bg-primary/15 text-primary border-primary/30" },
  invite_delete: { label: "Invite Deleted", icon: <Trash2 className="h-3.5 w-3.5" />, color: "bg-destructive/15 text-destructive border-destructive/30" },
  verification_update: { label: "Verification Update", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-secondary/15 text-secondary border-secondary/30" },
  login: { label: "Admin Login", icon: <Activity className="h-3.5 w-3.5" />, color: "bg-primary/15 text-primary border-primary/30" },
  admin_level_change: { label: "Admin Level Changed", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Map<string, AdminProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const logData = (data || []) as unknown as AuditLog[];
    setLogs(logData);

    // Fetch admin profiles
    const adminIds = [...new Set(logData.map((l) => l.admin_id))];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", adminIds);
      const map = new Map<string, AdminProfile>();
      profiles?.forEach((p) => map.set(p.user_id, p));
      setAdminProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((log) => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesSearch = !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase()) ||
      adminProfiles.get(log.admin_id)?.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionConfig = (action: string) =>
    ACTION_CONFIG[action] || { label: action, icon: <Activity className="h-3.5 w-3.5" />, color: "bg-muted text-muted-foreground" };

  const formatDetails = (log: AuditLog) => {
    const d = log.details;
    const parts: string[] = [];
    if (d.target_email) parts.push(`Target: ${d.target_email}`);
    if (d.target_name) parts.push(`User: ${d.target_name}`);
    if (d.old_role) parts.push(`${d.old_role} → ${d.new_role}`);
    if (d.new_role && !d.old_role) parts.push(`Role: ${d.new_role}`);
    if (d.email) parts.push(`Email: ${d.email}`);
    if (d.status) parts.push(`Status: ${d.status}`);
    if (d.old_level) parts.push(`${String(d.old_level).replace("_", " ")} → ${String(d.new_level).replace("_", " ")}`);
    if (d.new_level && !d.old_level) parts.push(`Level: ${String(d.new_level).replace("_", " ")}`);
    return parts.length > 0 ? parts.join(" · ") : "—";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search audit logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="role_change">Role Changes</SelectItem>
            <SelectItem value="password_reset">Password Resets</SelectItem>
            <SelectItem value="admin_invite">Admin Invites</SelectItem>
            <SelectItem value="invite_delete">Invite Deletions</SelectItem>
            <SelectItem value="verification_update">Verification Updates</SelectItem>
            <SelectItem value="login">Admin Logins</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2 shrink-0">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No audit logs found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((log) => {
              const config = getActionConfig(log.action);
              const admin = adminProfiles.get(log.admin_id);
              return (
                <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(log.created_at)}</span>
                    </div>
                    <p className="text-sm mt-0.5">
                      <span className="font-medium">{admin?.full_name || "Admin"}</span>
                      {" "}
                      <span className="text-muted-foreground">{formatDetails(log)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {logs.length} entries</p>
    </div>
  );
};

export default AdminAuditLog;
