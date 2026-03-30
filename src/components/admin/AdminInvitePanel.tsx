import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/auditLog";
import { canPerformAction, type AdminLevel } from "@/lib/adminPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Copy, Trash2, RefreshCw, Mail, Key, Check } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  status: string;
  token: string;
  created_at: string;
  accepted_at: string | null;
}

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const special = "!@#$%&*";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  return pwd;
};

interface AdminInvitePanelProps {
  adminLevel: AdminLevel;
}

const AdminInvitePanel = ({ adminLevel }: AdminInvitePanelProps) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [inviteAdminLevel, setInviteAdminLevel] = useState<string>("admin");

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from("admin_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    setInvitations((data as Invitation[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim()) return;
    setSending(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const generatedPassword = generatePassword();

      // First create the invitation record
      const { data: inviteData, error: inviteError } = await supabase
        .from("admin_invitations")
        .insert({ email: trimmedEmail, invited_by: user.id })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.code === "23505") {
          toast.error("An invitation for this email already exists.");
        } else {
          throw inviteError;
        }
        return;
      }

      // Create the admin user account via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke("create-admin-user", {
        body: {
          email: trimmedEmail,
          password: generatedPassword,
          fullName: fullName.trim() || trimmedEmail.split("@")[0],
          inviteToken: inviteData.token,
          adminLevel: inviteAdminLevel,
        },
      });

      if (fnError || fnData?.error) {
        // Rollback invitation if user creation failed
        await supabase.from("admin_invitations").delete().eq("id", inviteData.id);
        throw new Error(fnData?.error || fnError?.message || "Failed to create admin account");
      }

      toast.success("Admin account created successfully!");
      if (user) {
        logAdminAction(user.id, "admin_invite", "user", trimmedEmail, { email: trimmedEmail, name: fullName.trim() });
      }
      setCreatedCredentials({ email: trimmedEmail, password: generatedPassword });
      setEmail("");
      setFullName("");
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const text = `Admin Login Credentials\n\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\n\nLogin URL: ${window.location.origin}/admin/login\n\n⚠️ Please change your password after first login.`;
    navigator.clipboard.writeText(text);
    toast.success("All credentials copied to clipboard!");
  };

  const deleteInvitation = async (id: string, email: string) => {
    await supabase.from("admin_invitations").delete().eq("id", id);
    if (user) {
      logAdminAction(user.id, "invite_delete", "invitation", id, { email });
    }
    toast.success("Invitation deleted.");
    fetchInvitations();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Admin Invitations</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchInvitations} className="gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setCreatedCredentials(null);
              setEmail("");
              setFullName("");
            }
          }}>
            {canPerformAction(adminLevel, "invite_admin") && (
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><UserPlus className="h-3 w-3" /> Invite Admin</Button>
            </DialogTrigger>
            )}
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{createdCredentials ? "Admin Account Created" : "Invite New Admin"}</DialogTitle>
              </DialogHeader>

              {createdCredentials ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Share these credentials with the new admin:</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 border">
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-mono font-medium">{createdCredentials.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(createdCredentials.email, "Email")}>
                          {copiedField === "Email" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 border">
                        <div>
                          <p className="text-xs text-muted-foreground">Temporary Password</p>
                          <p className="text-sm font-mono font-medium">{createdCredentials.password}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(createdCredentials.password, "Password")}>
                          {copiedField === "Password" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 border">
                        <div>
                          <p className="text-xs text-muted-foreground">Login URL</p>
                          <p className="text-sm font-mono font-medium truncate max-w-[250px]">{window.location.origin}/admin/login</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(`${window.location.origin}/admin/login`, "URL")}>
                          {copiedField === "URL" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 px-3 py-2">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                        <Key className="h-3 w-3" />
                        The admin will be prompted to change their password on first login.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1" onClick={copyAllCredentials}>
                      <Copy className="h-4 w-4" /> Copy All
                    </Button>
                    <Button className="flex-1" onClick={() => {
                      setCreatedCredentials(null);
                      setDialogOpen(false);
                    }}>
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="Admin Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/50 border px-3 py-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Key className="h-3 w-3" />
                      A temporary password will be auto-generated. The admin must change it after first login.
                    </p>
                  </div>
                  <Button type="submit" disabled={sending} className="w-full">
                    {sending ? "Creating Account..." : "Create Admin Account"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
        ) : invitations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No invitations yet</div>
        ) : (
          <div className="divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className={
                  inv.status === "accepted" ? "bg-primary/15 text-primary border-primary/30" :
                  inv.status === "pending" ? "bg-secondary/15 text-secondary border-secondary/30" :
                  ""
                }>{inv.status}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteInvitation(inv.id, inv.email)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvitePanel;
