import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, UserCog, KeyRound, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole extends Profile {
  roles: AppRole[];
}

const AdminUsersTable = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [changingRole, setChangingRole] = useState(false);

  const fetchUsers = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roleMap = new Map<string, AppRole[]>();
    roles?.forEach((r) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => ({
      ...p,
      roles: roleMap.get(p.user_id) || [],
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchesSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.headline?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter as AppRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case "startup_founder": return "bg-primary/15 text-primary border-primary/30";
      case "investor": return "bg-secondary/15 text-secondary border-secondary/30";
      case "mentor": return "bg-accent/15 text-accent border-accent/30";
      case "ecosystem_partner": return "bg-blue-500/15 text-blue-600 border-blue-500/30";
      case "admin": return "bg-destructive/15 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleChangeRole = async () => {
    if (!roleDialogUser || !newRole) return;
    setChangingRole(true);
    try {
      // Delete existing roles for this user
      await supabase.from("user_roles").delete().eq("user_id", roleDialogUser.user_id);
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({ user_id: roleDialogUser.user_id, role: newRole as AppRole });
      if (error) throw error;
      toast.success(`Role updated to ${newRole.replace("_", " ")}`);
      setRoleDialogUser(null);
      setNewRole("");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingRole(false);
    }
  };

  const exportUsersCSV = () => {
    const headers = ["Name", "Headline", "Company", "Role", "Membership", "Verification", "Onboarding", "Location", "Joined"];
    const rows = filtered.map((u) => [
      u.full_name || "",
      u.headline || "",
      u.company_name || "",
      u.roles.join("; ") || "No role",
      u.membership,
      u.verification,
      u.onboarding_step,
      u.location || "",
      new Date(u.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported to CSV!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="startup_founder">Founders</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
            <SelectItem value="mentor">Mentors</SelectItem>
            <SelectItem value="ecosystem_partner">Partners</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportUsersCSV} className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Membership</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Verification</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Onboarding</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-muted">{user.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.headline || user.company_name || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? user.roles.map((role) => (
                          <Badge key={role} variant="outline" className={`text-[10px] capitalize ${getRoleBadgeColor(role)}`}>
                            {role.replace("_", " ")}
                          </Badge>
                        )) : <span className="text-muted-foreground text-xs">No role</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={user.membership === "premium" ? "bg-secondary/15 text-secondary border-secondary/30" : ""}>
                        {user.membership}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        user.verification === "verified" ? "bg-primary/15 text-primary border-primary/30" :
                        user.verification === "pending" ? "bg-secondary/15 text-secondary border-secondary/30" : ""
                      }>{user.verification}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={user.onboarding_step === "completed" ? "bg-primary/15 text-primary border-primary/30" : "bg-accent/15 text-accent border-accent/30"}>
                        {user.onboarding_step}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setRoleDialogUser(user); setNewRole(user.roles[0] || ""); }}>
                        <UserCog className="h-3 w-3" /> Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {users.length} users</p>

      {/* Role Management Dialog */}
      <Dialog open={!!roleDialogUser} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
          </DialogHeader>
          {roleDialogUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={roleDialogUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted">{roleDialogUser.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{roleDialogUser.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{roleDialogUser.headline || "—"}</p>
                  <div className="flex gap-1 mt-1">
                    {roleDialogUser.roles.map((r) => (
                      <Badge key={r} variant="outline" className={`text-[10px] capitalize ${getRoleBadgeColor(r)}`}>{r.replace("_", " ")}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup_founder">Startup Founder</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="ecosystem_partner">Ecosystem Partner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Warning: Changing a user's role will replace their current role. This action cannot be undone by the user.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRoleDialogUser(null)}>Cancel</Button>
                <Button onClick={handleChangeRole} disabled={changingRole || !newRole}>
                  {changingRole ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersTable;
