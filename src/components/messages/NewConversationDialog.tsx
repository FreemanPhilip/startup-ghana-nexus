import { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Building2, BadgeCheck, MessageSquare, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NetworkContact {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  company_name: string | null;
  location: string | null;
  industry: string | null;
  expertise: string[] | null;
  verification: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartConversation: (userId: string) => Promise<string | null>;
}

const NewConversationDialog = ({ open, onOpenChange, onStartConversation }: NewConversationDialogProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  const fetchConnectedContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get accepted connections (mutual follows via connection_requests)
    const { data: connections } = await supabase
      .from("connection_requests")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!connections || connections.length === 0) {
      // Fallback: also show people user follows (backwards compat)
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, headline, company_name, location, industry, expertise, verification")
          .in("user_id", followingIds);
        setContacts(profiles ?? []);
      } else {
        setContacts([]);
      }
      setLoading(false);
      return;
    }

    const connectedIds = connections.map(c =>
      c.sender_id === user.id ? c.receiver_id : c.sender_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, headline, company_name, location, industry, expertise, verification")
      .in("user_id", connectedIds);

    setContacts(profiles ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchConnectedContacts();
      setSearch("");
    }
  }, [open, fetchConnectedContacts]);

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q)
    );
  });

  const handleStart = async (userId: string) => {
    setStarting(userId);
    await onStartConversation(userId);
    setStarting(null);
    onOpenChange(false);
  };

  const getInitials = (name: string | null) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-lg">New Conversation</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your connections..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-3 pb-4">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Lock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">No connections yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? "No connections match your search"
                  : "Connect with people from the Network tab to start conversations"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filtered.map(contact => (
                <button
                  key={contact.user_id}
                  onClick={() => handleStart(contact.user_id)}
                  disabled={starting === contact.user_id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <div className="relative">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(contact.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.verification === "verified" && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                        <BadgeCheck className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{contact.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {contact.headline || contact.industry || "Ecosystem Member"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      {contact.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {contact.location}
                        </span>
                      )}
                      {contact.company_name && (
                        <span className="flex items-center gap-0.5">
                          <Building2 className="h-2.5 w-2.5" />
                          {contact.company_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="default"
                    className="shrink-0 gap-1 text-xs"
                    disabled={starting === contact.user_id}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {starting === contact.user_id ? "..." : "Chat"}
                  </Button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
