import { Bell, UserPlus, MessageSquare, Users, Heart, MessageCircle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const typeIconMap: Record<string, typeof Bell> = {
  follow: UserPlus,
  message: MessageSquare,
  group_invitation: Users,
  post_like: Heart,
  post_comment: MessageCircle,
};

const typeColorMap: Record<string, string> = {
  follow: "bg-primary/10 text-primary",
  message: "bg-blue-500/10 text-blue-500",
  group_invitation: "bg-emerald-500/10 text-emerald-500",
  post_like: "bg-rose-500/10 text-rose-500",
  post_comment: "bg-amber-500/10 text-amber-500",
};

const NotificationItem = ({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) => {
  const Icon = typeIconMap[notification.type] || Bell;
  const colorClass = typeColorMap[notification.type] || "bg-muted text-muted-foreground";
  const isUnread = !notification.read_at;

  return (
    <div
      className={`flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? "bg-primary/5" : ""}`}
      onClick={() => isUnread && onMarkRead(notification.id)}
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
      </div>
      {isUnread && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
    </div>
  );
};

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-bold">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary" onClick={markAllAsRead}>
                <Check className="h-3 w-3" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-muted-foreground" onClick={clearAll}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onMarkRead={markAsRead} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
