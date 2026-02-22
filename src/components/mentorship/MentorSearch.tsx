import { Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MentorSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick?: () => void;
}

const MentorSearch = ({ searchQuery, onSearchChange, onFilterClick }: MentorSearchProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, role"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-32 h-12 bg-card border-border text-sm"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          <Sparkles className="h-3.5 w-3.5" />
          Try AI Search
        </button>
      </div>

      {/* Filters button */}
      <Button
        variant="outline"
        className="h-12 gap-2 px-5 border-border"
        onClick={onFilterClick}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </Button>
    </div>
  );
};

export default MentorSearch;
