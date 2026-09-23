import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export interface PartnerProgram {
  id: string;
  title: string;
  organization: string;
  type: string;
  deadline: string | null;
}

export interface PartnerStartup {
  id: string;
  name: string;
  stage: string | null;
  industry: string | null;
}

export interface PartnerDashboardData {
  startupCount: number;
  opportunityCount: number;
  activeProgramCount: number;
  programs: PartnerProgram[];
  startups: PartnerStartup[];
}

const today = () => new Date().toISOString().slice(0, 10);

/** How an opportunity's deadline reads on the dashboard. */
export function programStatus(deadline: string | null, now = today()): "Open" | "Closed" | "Rolling" {
  if (!deadline) return "Rolling";
  return deadline >= now ? "Open" : "Closed";
}

async function fetchPartnerDashboard(): Promise<PartnerDashboardData> {
  const nowDate = today();

  const [startupCountRes, opportunityCountRes, programRes, startupRes] = await Promise.all([
    supabase.from("startups").select("id", { count: "exact", head: true }),
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase
      .from("opportunities")
      .select("id, title, organization, type, deadline")
      .order("is_featured", { ascending: false })
      .order("deadline", { ascending: true })
      .limit(5),
    supabase
      .from("startups")
      .select("id, name, stage, industry")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (startupCountRes.error) throw startupCountRes.error;
  if (opportunityCountRes.error) throw opportunityCountRes.error;
  if (programRes.error) throw programRes.error;
  if (startupRes.error) throw startupRes.error;

  const programs = (programRes.data ?? []) as PartnerProgram[];

  return {
    startupCount: startupCountRes.count ?? 0,
    opportunityCount: opportunityCountRes.count ?? 0,
    // "Active" means still open to applicants: no deadline, or one in the future.
    activeProgramCount: programs.filter((p) => programStatus(p.deadline, nowDate) !== "Closed").length,
    programs,
    startups: (startupRes.data ?? []) as PartnerStartup[],
  };
}

/**
 * Real figures for the ecosystem partner dashboard.
 *
 * These panels previously rendered hardcoded arrays and invented counts
 * (42 startups, 7 programs, "Seed Capital Bootcamp"), so the dashboard showed
 * the same numbers to every partner regardless of what was in the database.
 */
export function usePartnerDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["partnerDashboard"],
    queryFn: fetchPartnerDashboard,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["partnerDashboard"] });

  useRealtimeSubscription({ table: "opportunities" }, invalidate);
  useRealtimeSubscription({ table: "startups" }, invalidate);

  return {
    data: data ?? {
      startupCount: 0,
      opportunityCount: 0,
      activeProgramCount: 0,
      programs: [],
      startups: [],
    },
    loading: isLoading,
    isError,
    refetch,
  };
}
