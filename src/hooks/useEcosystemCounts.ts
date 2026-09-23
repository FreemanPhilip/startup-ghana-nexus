import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

/**
 * Platform-wide counts used by dashboard summary cards.
 *
 * Several dashboards passed literal zeros into their summary builders, so the
 * headline copy was computed from numbers that had nothing to do with the
 * database. These are the real counts, kept current by realtime.
 */
export function useOpenOpportunityCount() {
  const queryClient = useQueryClient();

  const { data = 0, isLoading } = useQuery({
    queryKey: ["openOpportunityCount"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      // Open means no deadline set, or a deadline that has not passed.
      const { count, error } = await supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .or(`deadline.is.null,deadline.gte.${today}`);
      if (error) throw error;
      return count ?? 0;
    },
  });

  useRealtimeSubscription({ table: "opportunities" }, () =>
    queryClient.invalidateQueries({ queryKey: ["openOpportunityCount"] }),
  );

  return { count: data, loading: isLoading };
}

export interface StageBreakdownEntry {
  label: string;
  value: number;
  count: number;
}

/** Live distribution of registered startups by stage. */
export function useStartupStageBreakdown() {
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["startupStageBreakdown"],
    queryFn: async (): Promise<StageBreakdownEntry[]> => {
      const { data: rows, error } = await supabase.from("startups").select("stage");
      if (error) throw error;

      const counts = new Map<string, number>();
      (rows ?? []).forEach((row) => {
        const stage = (row.stage ?? "").trim() || "Unspecified";
        counts.set(stage, (counts.get(stage) ?? 0) + 1);
      });

      const total = rows?.length ?? 0;
      return Array.from(counts.entries())
        .map(([label, count]) => ({
          label,
          count,
          value: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  useRealtimeSubscription({ table: "startups" }, () =>
    queryClient.invalidateQueries({ queryKey: ["startupStageBreakdown"] }),
  );

  return { breakdown: data, loading: isLoading, isError };
}
