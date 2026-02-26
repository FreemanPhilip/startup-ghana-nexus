import { SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvestorFiltersProps {
  industry: string;
  ticketSize: string;
  region: string;
  onIndustryChange: (v: string) => void;
  onTicketSizeChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onClear: () => void;
}

const InvestorFilters = ({
  industry, ticketSize, region,
  onIndustryChange, onTicketSizeChange, onRegionChange, onClear,
}: InvestorFiltersProps) => {
  const hasFilters = industry !== "all" || ticketSize !== "all" || region !== "all";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Refine Search</h3>
        </div>
        {hasFilters && (
          <button onClick={onClear} className="text-xs font-medium text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Industry Sector
          </label>
          <Select value={industry} onValueChange={onIndustryChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="fintech">FinTech</SelectItem>
              <SelectItem value="agritech">AgriTech</SelectItem>
              <SelectItem value="healthtech">HealthTech</SelectItem>
              <SelectItem value="cleantech">CleanTech</SelectItem>
              <SelectItem value="proptech">PropTech</SelectItem>
              <SelectItem value="edtech">EdTech</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ticket Size
          </label>
          <Select value={ticketSize} onValueChange={onTicketSizeChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Any Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Size</SelectItem>
              <SelectItem value="0-50k">GH₵0 - GH₵500k</SelectItem>
              <SelectItem value="50k-250k">GH₵500k - GH₵2.5M</SelectItem>
              <SelectItem value="250k-1m">GH₵2.5M - GH₵10M</SelectItem>
              <SelectItem value="1m+">GH₵10M+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Region
          </label>
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="greater-accra">Greater Accra</SelectItem>
              <SelectItem value="ashanti">Ashanti</SelectItem>
              <SelectItem value="western">Western</SelectItem>
              <SelectItem value="pan-african">Pan-African</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default InvestorFilters;
