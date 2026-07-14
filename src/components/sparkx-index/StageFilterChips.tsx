import { cn } from "@/lib/utils";

interface StageFilterChipsProps {
  stages: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}

export function StageFilterChips({ stages, selected, onChange }: StageFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {stages.map(stage => (
        <button
          key={stage.value}
          onClick={() => onChange(stage.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            "border hover:border-primary/50",
            selected === stage.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          {stage.label}
        </button>
      ))}
    </div>
  );
}
