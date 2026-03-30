import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Copy, Trash2, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  status: string;
  token: string;
  created_at: string;
  accepted_at: string | null;
}

const AdminInvitePanel = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      const { data, error } = await supabase
        .from("admin_invitations")
        .insert({ email: email.trim().toLowerCase(), invited_by: user.id })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          toast.error("An invitation for this email already exists.");
        } else {
          throw error;
        }
      } else {
        toast.success("Admin invitation created!");
        setEmail("");
        setDialogOpen(false);
        fetchInvitations();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/login?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard!");
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("admin_invitations").delete().eq("id", id);
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><UserPlus className="h-3 w-3" /> Invite Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Admin</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                  </div>
                  <p className="text-xs text-muted-foreground">An invitation link will be generated. Share it with the new admin to complete their signup.</p>
                </div>
                <Button type="submit" disabled={sending} className="w-full">{sending ? "Creating..." : "Create Invitation"}</Button>
              </form>
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
                {inv.status === "pending" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyInviteLink(inv.token)} title="Copy invite link">
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteInvitation(inv.id)} title="Delete">
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
