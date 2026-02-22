import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, Star, Lightbulb, Code, TrendingUp, Palette, BarChart3, Users, Globe, Briefcase, Rocket, Layers } from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: Layers },
  { id: "available", label: "Available ASAP", icon: Zap },
  { id: "top_rated", label: "Top Rated", icon: Star },
  { id: "fintech", label: "FinTech", icon: TrendingUp },
  { id: "agritech", label: "AgriTech", icon: Globe },
  { id: "healthtech", label: "HealthTech", icon: Lightbulb },
  { id: "engineering", label: "Engineering", icon: Code },
  { id: "product", label: "Product", icon: Palette },
  { id: "data_science", label: "Data Science", icon: BarChart3 },
  { id: "leadership", label: "Leadership", icon: Users },
  { id: "fundraising", label: "Fundraising", icon: Briefcase },
  { id: "growth", label: "Growth", icon: Rocket },
];

interface MentorCategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const MentorCategoryTabs = ({ activeCategory, onCategoryChange }: MentorCategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => scroll("left")}
        className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-none py-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 text-xs font-medium transition-all shrink-0 min-w-[80px] ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MentorCategoryTabs;
