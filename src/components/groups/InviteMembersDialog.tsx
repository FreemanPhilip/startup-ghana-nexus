import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Search, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface InviteMembersDialogProps {
  groupId: string;
  existingMemberIds: string[];
  onInvite: (userId: string) => Promise<void>;
}

interface NetworkUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

const InviteMembersDialog = ({ groupId, existingMemberIds, onInvite }: InviteMembersDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !user) return;
    const fetchNetwork = async () => {
      setLoading(true);
      // Get people the user follows
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followingIds = follows?.map(f => f.following_id).filter(id => !existingMemberIds.includes(id)) || [];
      if (followingIds.length === 0) { setUsers([]); setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headline")
        .in("user_id", followingIds);
      setUsers(profiles || []);
      setLoading(false);
    };
    fetchNetwork();
  }, [open, user, existingMemberIds]);

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.headline || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    await onInvite(userId);
    setInvited(prev => new Set(prev).add(userId));
    setInviting(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <UserPlus className="h-3.5 w-3.5" /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Invite Members</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search your network..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No contacts found in your network.</p>
          ) : (
            filtered.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-xs">{(u.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.headline || "Member"}</p>
                </div>
                <Button
                  size="sm"
                  variant={invited.has(u.user_id) ? "secondary" : "default"}
                  className="text-xs gap-1"
                  disabled={invited.has(u.user_id) || inviting === u.user_id}
                  onClick={() => handleInvite(u.user_id)}
                >
                  {inviting === u.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> :
                   invited.has(u.user_id) ? "Invited" : <><Send className="h-3 w-3" /> Invite</>}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMembersDialog;
