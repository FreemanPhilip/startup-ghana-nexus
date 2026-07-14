import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface InvestorView {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_icon: string | null;
  viewed_at: string;
  timeAgo: string;
}

interface ShortlistedInvestor {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_data: Record<string, unknown>;
  created_at: string;
}

export function useInvestorTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: viewsData, isLoading: loadingViews } = useQuery({
    queryKey: ["investorViews", user?.id],
    queryFn: async (): Promise<InvestorView[]> => {
      const { data } = await supabase
        .from("investor_views")
        .select("*")
        .eq("user_id", user!.id)
        .order("viewed_at", { ascending: false })
        .limit(5);
      return (data ?? []).map(v => ({
        ...v,
        timeAgo: `Viewed ${formatDistanceToNow(new Date(v.viewed_at), { addSuffix: false })} ago`,
      }));
    },
    enabled: !!user,
  });

  const { data: shortlisted = [], isLoading: loadingShortlisted } = useQuery({
    queryKey: ["investorShortlists", user?.id],
    queryFn: async (): Promise<ShortlistedInvestor[]> => {
      const { data } = await supabase
        .from("investor_shortlists")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as ShortlistedInvestor[]) ?? [];
    },
    enabled: !!user,
  });

  const recentViews = viewsData ?? [];

  const trackView = useMutation({
    mutationFn: async ({ investorId, investorName, investorIcon }: { investorId: string; investorName: string; investorIcon?: string }) => {
      await supabase.from("investor_views").delete().eq("user_id", user!.id).eq("investor_id", investorId);
      await supabase.from("investor_views").insert({
        user_id: user!.id,
        investor_id: investorId,
        investor_name: investorName,
        investor_icon: investorIcon || null,
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["investorViews", user?.id] }),
  });

  const toggleShortlist = useMutation({
    mutationFn: async ({ investorId, investorName, investorData }: { investorId: string; investorName: string; investorData?: Record<string, unknown> }) => {
      const existing = shortlisted.find(s => s.investor_id === investorId);
      if (existing) {
        await supabase.from("investor_shortlists").delete().eq("id", existing.id);
      } else {
        await supabase.from("investor_shortlists").insert({
          user_id: user!.id,
          investor_id: investorId,
          investor_name: investorName,
          investor_data: investorData || {},
        });
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["investorShortlists", user?.id] }),
  });

  const clearHistory = useMutation({
    mutationFn: () => supabase.from("investor_views").delete().eq("user_id", user!.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["investorViews", user?.id] }),
  });

  const isShortlisted = (investorId: string) => shortlisted.some(s => s.investor_id === investorId);

  return {
    recentViews,
    shortlisted,
    loading: loadingViews || loadingShortlisted,
    trackView: trackView.mutate,
    toggleShortlist: toggleShortlist.mutate,
    isShortlisted,
    clearHistory: clearHistory.mutate,
    refetchShortlisted: () => queryClient.invalidateQueries({ queryKey: ["investorShortlists", user?.id] }),
  };
}
