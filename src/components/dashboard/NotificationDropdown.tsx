import { Bell, UserPlus, MessageSquare, Users, Heart, MessageCircle, Check, Trash2, Building2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useConnections } from "@/hooks/useConnections";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const typeIconMap: Record<string, typeof Bell> = {
  follow: UserPlus,
  message: MessageSquare,
  group_invitation: Users,
  post_like: Heart,
  post_comment: MessageCircle,
  startup_invitation: Building2,
  connection_request: UserPlus,
  connection_accepted: Check,
};

const typeColorMap: Record<string, string> = {
  follow: "bg-primary/10 text-primary",
  message: "bg-blue-500/10 text-blue-500",
  group_invitation: "bg-emerald-500/10 text-emerald-500",
  post_like: "bg-rose-500/10 text-rose-500",
  post_comment: "bg-amber-500/10 text-amber-500",
  startup_invitation: "bg-violet-500/10 text-violet-500",
  connection_request: "bg-primary/10 text-primary",
  connection_accepted: "bg-emerald-500/10 text-emerald-500",
};

const NotificationItem = ({
  notification,
  onMarkRead,
  onConfirmStartup,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onConfirmStartup: (membershipId: string, notifId: string) => void;
}) => {
  const Icon = typeIconMap[notification.type] || Bell;
  const colorClass = typeColorMap[notification.type] || "bg-muted text-muted-foreground";
  const isUnread = !notification.read_at;
  const isStartupInvite = notification.type === "startup_invitation" && isUnread;

  return (
    <div
      className={`flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? "bg-primary/5" : ""}`}
      onClick={() => !isStartupInvite && isUnread && onMarkRead(notification.id)}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
          {notification.body || notification.title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
        {isStartupInvite && notification.reference_id && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="h-6 text-[10px] bg-primary text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmStartup(notification.reference_id!, notification.id);
              }}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
      {isUnread && !isStartupInvite && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
    </div>
  );
};

const ConnectionRequestItem = ({
  request,
  onAccept,
  onReject,
  processing,
}: {
  request: any;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  processing: string | null;
}) => {
  const profile = request.sender_profile;
  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 transition-colors">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{profile?.full_name || "Someone"}</p>
        <p className="text-[10px] text-muted-foreground truncate">{profile?.headline || profile?.company_name || "wants to connect"}</p>
        {request.message && (
          <p className="text-[10px] text-foreground/70 italic mt-0.5 line-clamp-2">"{request.message}"</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </p>
        <div className="flex gap-1.5 mt-2">
          <Button
            size="sm"
            className="h-6 text-[10px] gap-1 bg-primary text-primary-foreground"
            disabled={processing === request.id}
            onClick={(e) => { e.stopPropagation(); onAccept(request.id); }}
          >
            {processing === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] gap-1"
            disabled={processing === request.id}
            onClick={(e) => { e.stopPropagation(); onReject(request.id); }}
          >
            <X className="h-3 w-3" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { pendingReceived, acceptRequest, rejectRequest, pendingCount, loading: connectionsLoading } = useConnections();
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleConfirmStartup = async (membershipId: string, notifId: string) => {
    if (confirming) return;
    setConfirming(true);
    try {
      const { error } = await supabase
        .from("startup_members")
        .update({ confirmed: true })
        .eq("id", membershipId);
      if (error) throw error;
      await markAsRead(notifId);
      toast.success("Affiliation confirmed!");
    } catch {
      toast.error("Failed to confirm affiliation");
    } finally {
      setConfirming(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessing(requestId);
    const { error } = await acceptRequest(requestId);
    if (!error) toast.success("Connection accepted!");
    setProcessing(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    const { error } = await rejectRequest(requestId);
    if (!error) toast.success("Request declined");
    setProcessing(null);
  };

  const totalBadge = unreadCount + pendingCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {totalBadge > 99 ? "99+" : totalBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end" sideOffset={8}>
        <Tabs defaultValue="notifications">
          <div className="border-b border-border px-2 pt-2">
            <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-0">
              <TabsTrigger
                value="notifications"
                className="rounded-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1 text-xs font-semibold"
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="rounded-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1 text-xs font-semibold"
              >
                Requests
                {pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-0">
            <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary" onClick={markAllAsRead}>
                  <Check className="h-3 w-3" /> Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={clearAll}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <NotificationItem key={n.id} notification={n} onMarkRead={markAsRead} onConfirmStartup={handleConfirmStartup} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <ScrollArea className="max-h-80">
              {connectionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : pendingReceived.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingReceived.map(req => (
                    <ConnectionRequestItem
                      key={req.id}
                      request={req}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      processing={processing}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
