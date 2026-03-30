import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
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

  useEffect(() => {
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
    fetchUsers();
  }, []);

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
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
                        user.verification === "pending" ? "bg-secondary/15 text-secondary border-secondary/30" :
                        ""
                      }>
                        {user.verification}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={user.onboarding_step === "completed" ? "bg-primary/15 text-primary border-primary/30" : "bg-accent/15 text-accent border-accent/30"}>
                        {user.onboarding_step}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {users.length} users</p>
    </div>
  );
};

export default AdminUsersTable;
