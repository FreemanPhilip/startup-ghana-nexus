import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  type Notification,
} from "@/lib/supabase/queries/notifications";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  useRealtimeSubscription(
    { table: "notifications", filter: `user_id=eq.${user?.id}` },
    () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
    !!user
  );

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAsRead = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications", user?.id]);
      queryClient.setQueryData<Notification[]>(["notifications", user?.id], old =>
        old?.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["notifications", user?.id], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => markAllNotificationsAsRead(user!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications", user?.id]);
      queryClient.setQueryData<Notification[]>(["notifications", user?.id], old =>
        old?.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["notifications", user?.id], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const clearAll = useMutation({
    mutationFn: () => clearAllNotifications(user!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications", user?.id]);
      queryClient.setQueryData<Notification[]>(["notifications", user?.id], []);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["notifications", user?.id], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    clearAll: clearAll.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  };
}
