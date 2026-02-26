import { useState, useEffect, useCallback } from "react";
import { Users, UserMinus, Mail, Clock, CheckCircle2, XCircle, ChevronDown, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  confirmed: boolean;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface StartupTeamManagementProps {
  startupId: string;
  team: TeamMember[];
  onTeamUpdated: () => void;
}

const SYSTEM_ROLES = ["owner", "admin"] as const;
const TEAM_TITLES = [
  "CTO", "CEO", "COO", "CFO", "CMO",
  "Product Designer", "UI/UX Designer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Mobile Developer", "DevOps Engineer", "Data Scientist", "Data Analyst",
  "Product Manager", "Project Manager", "Scrum Master",
  "Marketing Lead", "Growth Hacker", "Content Creator", "Community Manager",
  "Sales Lead", "Business Development", "Customer Success",
  "HR Manager", "Operations Lead", "Legal Advisor",
  "Mentor", "Advisor", "Board Member", "Investor",
  "Intern", "Volunteer", "Contributor",
  "Editor", "Employee",
] as const;
const ALL_ROLES = [...SYSTEM_ROLES, ...TEAM_TITLES.map(t => t.toLowerCase())] as const;

const roleBadgeColor = (role: string) => {
  switch (role) {
    case "owner": return "bg-primary/10 text-primary border-0";
    case "admin": return "bg-secondary/10 text-secondary border-0";
    default: return "bg-muted text-foreground border-0";
  }
};

const formatRoleDisplay = (role: string) => {
  // Check if it matches a known team title (case insensitive)
  const found = TEAM_TITLES.find(t => t.toLowerCase() === role.toLowerCase());
  if (found) return found;
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const StartupTeamManagement = ({ startupId, team, onTeamUpdated }: StartupTeamManagementProps) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [submitting, setSubmitting] = useState(false);

  const myRole = team.find(m => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner";
  const isAdmin = myRole === "owner" || myRole === "admin";

  const fetchInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    const { data } = await supabase
      .from("startup_invitations")
      .select("id, email, role, status, created_at")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false });
    setInvitations((data as Invitation[]) ?? []);
    setLoadingInvitations(false);
  }, [startupId]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setSubmitting(true);
    try {
      // Check if user exists by email - find profile
      // First insert invitation record
      const { error } = await supabase.from("startup_invitations").insert({
        startup_id: startupId,
        email: inviteEmail.trim(),
        role: inviteRole,
        invited_by: user.id,
      } as any);
      if (error) throw error;

      // Try to find user and add as unconfirmed member
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("full_name", `%${inviteEmail.trim()}%`)
        .limit(1);

      // For now, invitation is recorded. User confirms via notification when added as member.
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      setInviteRole("employee");
      fetchInvitations();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string, memberUserId: string) => {
    if (memberUserId === user?.id && newRole !== "owner") {
      toast.error("You cannot change your own role");
      return;
    }
    try {
      const { error } = await supabase
        .from("startup_members")
        .update({ role: newRole })
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Role updated");
      onTeamUpdated();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) {
      toast.error("You cannot remove yourself");
      return;
    }
    try {
      const { error } = await supabase
        .from("startup_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Member removed");
      onTeamUpdated();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("startup_invitations")
        .delete()
        .eq("id", invitationId);
      if (error) throw error;
      toast.success("Invitation cancelled");
      fetchInvitations();
    } catch {
      toast.error("Failed to cancel invitation");
    }
  };

  const confirmedTeam = team.filter(m => m.confirmed);
  const pendingMembers = team.filter(m => !m.confirmed);

  return (
    <div className="space-y-5">
      {/* Invite new member */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Invite Team Member
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="h-9 text-sm flex-1"
              type="email"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="h-9 w-full sm:w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                {TEAM_TITLES.map(t => (
                  <SelectItem key={t} value={t.toLowerCase()} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-9 text-xs"
              disabled={!inviteEmail.trim() || submitting}
              onClick={handleInvite}
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Send Invite
            </Button>
          </div>
        </div>
      )}

      {/* Active team members */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Active Members ({confirmedTeam.length})
        </h3>
        {confirmedTeam.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No confirmed team members.</p>
        ) : (
          <div className="space-y-2">
            {confirmedTeam.map(m => {
              const initials = m.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
              const isSelf = m.user_id === user?.id;
              const canManage = isAdmin && !isSelf && m.role !== "owner";
              const canChangeRole = isOwner && !isSelf;

              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{m.profile?.full_name || "Unknown"}</p>
                      {isSelf && <Badge variant="outline" className="text-[9px] h-4 px-1">You</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{m.profile?.headline || ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canChangeRole ? (
                      <Select
                        value={m.role}
                        onValueChange={(val) => handleChangeRole(m.id, val, m.user_id)}
                      >
                        <SelectTrigger className="h-7 w-32 text-[10px]">
                          <SelectValue>{formatRoleDisplay(m.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {SYSTEM_ROLES.map(r => (
                            <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                          ))}
                          {TEAM_TITLES.map(t => (
                            <SelectItem key={t} value={t.toLowerCase()} className="text-xs">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`text-[10px] ${roleBadgeColor(m.role)}`}>
                        {formatRoleDisplay(m.role)}
                      </Badge>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(m.id, m.user_id)}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending confirmations */}
      {pendingMembers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-destructive/70" /> Pending Confirmation ({pendingMembers.length})
          </h3>
          <div className="space-y-2">
            {pendingMembers.map(m => {
              const initials = m.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border">
                  <Avatar className="h-10 w-10 opacity-60">
                    <AvatarImage src={m.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-muted-foreground">{m.profile?.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">Awaiting confirmation</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{formatRoleDisplay(m.role)}</Badge>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveMember(m.id, m.user_id)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invitations */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Invitations ({invitations.length})
        </h3>
        {loadingInvitations ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No invitations sent yet.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Invited {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{inv.role}</Badge>
                <Badge
                  variant={inv.status === "accepted" ? "default" : inv.status === "declined" ? "destructive" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {inv.status === "pending" && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                  {inv.status === "accepted" && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                  {inv.status === "declined" && <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                  {inv.status}
                </Badge>
                {isAdmin && inv.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteInvitation(inv.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupTeamManagement;
