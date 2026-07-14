import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IndexStartup {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  sector: string | null;
  stage: string | null;
  city: string | null;
  country: string | null;
  founded_year: number | null;
  team_size: number | null;
  is_raising: boolean;
  sparkx_score: number | null;
  verified: boolean;
  claimed_by_startup_id: string | null;
}

export interface FundingRound {
  id: string;
  index_startup_id: string;
  round_type: string;
  amount_usd: number | null;
  announced_on: string | null;
  notes: string | null;
  source_url: string | null;
  investors: { name: string; is_lead: boolean }[];
}

export interface StartupFilters {
  search?: string;
  sector?: string;
  stage?: string;
  location?: string;
  raising?: boolean;
}

export const STAGES = [
  { value: "all", label: "All Stages" },
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "growth", label: "Growth" },
  { value: "mature", label: "Mature" },
];

export const SECTORS = [
  "fintech", "agritech", "healthtech", "edtech", "ecommerce", "logistics",
  "energy", "creative", "mobility", "proptech", "insurtech", "cleantech",
  "ai", "saas", "deeptech", "media", "other",
];

function formatStage(stage: string | null): string {
  if (!stage) return "Unknown";
  return stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatSector(sector: string | null): string {
  if (!sector) return "Other";
  return sector.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchStartupRounds(startupIds: string[]): Promise<Map<string, FundingRound[]>> {
  if (startupIds.length === 0) return new Map();

  const { data: rounds } = await supabase
    .from("index_funding_rounds")
    .select("*")
    .in("index_startup_id", startupIds)
    .order("announced_on", { ascending: false });

  if (!rounds || rounds.length === 0) return new Map();

  const roundIds = rounds.map(r => r.id);
  const { data: roundInvestors } = await supabase
    .from("index_round_investors")
    .select("round_id, index_investor_id, is_lead")
    .in("round_id", roundIds);

  const investorIds = [...new Set((roundInvestors ?? []).map(ri => ri.index_investor_id))];
  const { data: investors } = investorIds.length > 0
    ? await supabase.from("index_investors").select("id, name").in("id", investorIds)
    : { data: [] };

  const investorMap = new Map(investors?.map(i => [i.id, i.name]) ?? []);

  const roundsByStartup = new Map<string, FundingRound[]>();
  for (const round of rounds) {
    const investorNames = (roundInvestors ?? [])
      .filter(ri => ri.round_id === round.id)
      .map(ri => ({ name: investorMap.get(ri.index_investor_id) ?? "Unknown", is_lead: ri.is_lead }));

    const enriched: FundingRound = {
      ...round,
      investors: investorNames,
    };

    const existing = roundsByStartup.get(round.index_startup_id) ?? [];
    existing.push(enriched);
    roundsByStartup.set(round.index_startup_id, existing);
  }

  return roundsByStartup;
}

export function useIndexStartups(filters: StartupFilters) {
  return useQuery({
    queryKey: ["indexStartups", filters],
    queryFn: async (): Promise<IndexStartup[]> => {
      const { data } = await supabase
        .from("index_startups")
        .select("*")
        .order("sparkx_score", { ascending: false });

      if (!data) return [];

      let results = data as IndexStartup[];

      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q)
        );
      }

      if (filters.sector && filters.sector !== "all") {
        results = results.filter(s => s.sector === filters.sector);
      }

      if (filters.stage && filters.stage !== "all") {
        results = results.filter(s => s.stage === filters.stage);
      }

      if (filters.location) {
        const loc = filters.location.toLowerCase();
        results = results.filter(s =>
          s.city?.toLowerCase().includes(loc) ||
          s.country?.toLowerCase().includes(loc)
        );
      }

      if (filters.raising) {
        results = results.filter(s => s.is_raising);
      }

      return results;
    },
  });
}

export function useStartupRounds(startupIds: string[]) {
  return useQuery({
    queryKey: ["startupRounds", startupIds],
    queryFn: () => fetchStartupRounds(startupIds),
    enabled: startupIds.length > 0,
  });
}

export { formatStage, formatSector };
