import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchStartupsByUser,
  createStartup,
  updateStartup,
  addStartupMember,
  removeStartupMember,
} from "@/lib/supabase/queries/startups";
import type { Startup, EnrichedStartup } from "@/lib/supabase/queries/startups";
import { toast } from "@/hooks/use-toast";

export type { Startup, EnrichedStartup };

export function useStartups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: startups = [], isLoading } = useQuery({
    queryKey: ["startups", user?.id],
    queryFn: () => fetchStartupsByUser(user!.id),
    enabled: !!user,
  });

  const addStartup = useMutation({
    mutationFn: (input: Parameters<typeof createStartup>[0]) => createStartup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", user?.id] });
      toast({ title: "Startup created!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editStartup = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Startup, "id" | "created_at">> }) =>
      updateStartup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups", user?.id] });
      toast({ title: "Startup updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addMember = useMutation({
    mutationFn: ({ startupId, userId, role }: { startupId: string; userId: string; role?: string }) =>
      addStartupMember(startupId, userId, role),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["startups", user?.id] }),
  });

  const removeMember = useMutation({
    mutationFn: ({ startupId, userId }: { startupId: string; userId: string }) =>
      removeStartupMember(startupId, userId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["startups", user?.id] }),
  });

  return {
    myStartups: startups,
    loading: isLoading,
    addStartup: addStartup.mutateAsync,
    editStartup: editStartup.mutateAsync,
    addMember: addMember.mutate,
    removeMember: removeMember.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["startups", user?.id] }),
  };
}
