import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Users, TrendingUp, Star, Briefcase, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetwork } from "@/hooks/useNetwork";
import { useMessages } from "@/hooks/useMessages";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "@/hooks/use-toast";
import NetworkCard from "./NetworkCard";
import ConnectionRequestDialog from "./ConnectionRequestDialog";
import PendingRequestsPanel from "./PendingRequestsPanel";
import QuickChatDialog from "@/components/messages/QuickChatDialog";
import PublicProfilePage from "@/components/profile/PublicProfilePage";

const roleFilters = [
  { id: "all", label: "All", icon: Layers },
  { id: "startup_founder", label: "Founders", icon: Briefcase },
  { id: "investor", label: "Investors", icon: TrendingUp },
  { id: "mentor", label: "Mentors", icon: Star },
  { id: "ecosystem_partner", label: "Partners", icon: Users },
];

interface NetworkPageProps {
  onOpenMessages?: () => void;
}

const NetworkPage = ({ onOpenMessages }: NetworkPageProps) => {
  const { profiles, loading, isFollowing, toggleFollow, followerCount, followingCount } = useNetwork();
  const { pendingReceived, sendRequest, acceptRequest, rejectRequest, getRequestStatus, loading: connectionsLoading } = useConnections();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [connectTarget, setConnectTarget] = useState<{ userId: string; name: string } | null>(null);
  const [chatTarget, setChatTarget] = useState<{
    userId: string;
    name: string;
    avatar: string | null;
  } | null>(null);

  const handleMessage = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    const status = getRequestStatus(userId);
    if (status !== "connected") {
      toast({ title: "Not connected", description: "You need to be connected to message this person.", variant: "destructive" });
      return;
    }
    setChatTarget({
      userId,
      name: profile?.full_name || "User",
      avatar: profile?.avatar_url || null,
    });
  };

  const handleConnect = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    setConnectTarget({ userId, name: profile?.full_name || "User" });
  };

  const handleAcceptFromCard = async (userId: string) => {
    const req = pendingReceived.find(r => r.sender_id === userId);
    if (req) {
      const ok = await acceptRequest(req.id);
      if (ok) toast({ title: "Connected!", description: `You're now connected.` });
    }
  };

  const handleSendRequest = async (message?: string) => {
    if (!connectTarget) return false;
    const ok = await sendRequest(connectTarget.userId, message);
    if (ok) toast({ title: "Request sent!", description: `Connection request sent to ${connectTarget.name}.` });
    return ok;
  };

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        !search ||
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.headline?.toLowerCase().includes(search.toLowerCase()) ||
        p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.industry?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || p.roles.includes(roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [profiles, search, roleFilter]);

  if (selectedUserId) {
    return (
      <PublicProfilePage
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
        onMessage={handleMessage}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="text-center px-4">
          <p className="text-lg font-bold">{followingCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center px-4">
          <p className="text-lg font-bold">{followerCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center px-4">
          <p className="text-lg font-bold">{profiles.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Network</p>
        </div>
      </div>

      {/* Pending connection requests */}
      <PendingRequestsPanel
        requests={pendingReceived}
        loading={connectionsLoading}
        onAccept={acceptRequest}
        onReject={rejectRequest}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-card border-border text-sm"
        />
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none py-1" style={{ scrollbarWidth: "none" }}>
        {roleFilters.map((f) => {
          const Icon = f.icon;
          const isActive = roleFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.user_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <NetworkCard
                profile={p}
                isFollowing={isFollowing(p.user_id)}
                connectionStatus={getRequestStatus(p.user_id)}
                onToggleFollow={toggleFollow}
                onConnect={handleConnect}
                onAcceptRequest={handleAcceptFromCard}
                onMessage={handleMessage}
                onViewProfile={setSelectedUserId}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search || roleFilter !== "all"
              ? "No members match your search or filters."
              : "No other members in the ecosystem yet. Invite someone!"}
          </p>
        </div>
      )}

      {/* Connection Request Dialog */}
      {connectTarget && (
        <ConnectionRequestDialog
          open={!!connectTarget}
          onOpenChange={(open) => { if (!open) setConnectTarget(null); }}
          targetName={connectTarget.name}
          onSend={handleSendRequest}
        />
      )}

      {/* Quick Chat Dialog */}
      {chatTarget && (
        <QuickChatDialog
          open={!!chatTarget}
          onClose={() => setChatTarget(null)}
          targetUserId={chatTarget.userId}
          targetUserName={chatTarget.name}
          targetUserAvatar={chatTarget.avatar}
          onOpenFullChat={onOpenMessages}
        />
      )}
    </div>
  );
};

export default NetworkPage;
