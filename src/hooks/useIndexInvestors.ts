import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IndexInvestor {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  hq_country: string | null;
  type: string | null;
  focus_sectors: string[];
  stage_focus: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  verified: boolean;
}

export const INVESTOR_TYPES = [
  { value: "all", label: "All Types" },
  { value: "vc", label: "Venture Capital" },
  { value: "angel", label: "Angel Investor" },
  { value: "accelerator", label: "Accelerator" },
  { value: "corporate", label: "Corporate VC" },
  { value: "dfi", label: "DFI" },
  { value: "family_office", label: "Family Office" },
  { value: "syndicate", label: "Syndicate" },
  { value: "government", label: "Government" },
];

export interface InvestorFilters {
  search?: string;
  type?: string;
  sector?: string;
}

function formatInvestorType(type: string | null): string {
  if (!type) return "Other";
  const map: Record<string, string> = {
    vc: "Venture Capital",
    angel: "Angel Investor",
    accelerator: "Accelerator",
    corporate: "Corporate VC",
    dfi: "DFI",
    family_office: "Family Office",
    syndicate: "Syndicate",
    government: "Government",
  };
  return map[type] || type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatCheckSize(amount: number | null): string {
  if (!amount) return "";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`;
  return `$${amount}`;
}

export function useIndexInvestors(filters: InvestorFilters) {
  return useQuery({
    queryKey: ["indexInvestors", filters],
    queryFn: async (): Promise<IndexInvestor[]> => {
      const { data } = await supabase
        .from("index_investors")
        .select("*")
        .order("name");

      if (!data) return [];

      let results = data as IndexInvestor[];

      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(i =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.hq_country?.toLowerCase().includes(q) ||
          i.focus_sectors.some(s => s.toLowerCase().includes(q))
        );
      }

      if (filters.type && filters.type !== "all") {
        results = results.filter(i => i.type === filters.type);
      }

      if (filters.sector && filters.sector !== "all") {
        results = results.filter(i => i.focus_sectors.includes(filters.sector!));
      }

      return results;
    },
  });
}

export { formatInvestorType, formatCheckSize };
