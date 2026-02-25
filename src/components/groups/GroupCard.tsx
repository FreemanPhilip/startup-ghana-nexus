import { Users, Lock, Building2, Code, Lightbulb, Heart, Landmark, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Group } from "@/hooks/useGroups";

const iconMap: Record<string, React.ElementType> = {
  building: Building2, code: Code, lightbulb: Lightbulb, heart: Heart, landmark: Landmark, briefcase: Briefcase, users: Users,
};

const colorPresets = [
  "from-blue-600 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-purple-500 to-pink-600",
  "from-slate-700 to-slate-900",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

function getActivityLabel(count: number) {
  if (count >= 20) return { label: "VERY ACTIVE", color: "text-emerald-600" };
  if (count >= 10) return { label: "HIGH ACTIVITY", color: "text-blue-600" };
  if (count >= 3) return { label: "MODERATE", color: "text-amber-600" };
  if (count >= 1) return { label: "STEADY", color: "text-muted-foreground" };
  return { label: "NEW", color: "text-muted-foreground" };
}

interface GroupCardProps {
  group: Group;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onView: (id: string) => void;
}

const GroupCard = ({ group, onJoin, onLeave, onView }: GroupCardProps) => {
  const Icon = iconMap[group.icon || "users"] || Users;
  const gradient = group.cover_color || colorPresets[Math.floor(Math.random() * colorPresets.length)];
  const activity = getActivityLabel(group.post_count_today);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(group.id)}>
      {/* Cover */}
      <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
        <div className="absolute -bottom-5 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border shadow-sm">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        {group.is_private && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-7 pb-4 space-y-3">
        <div>
          <h3 className="font-display font-bold text-sm truncate">{group.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{group.description || "No description"}</p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-foreground">{group.member_count.toLocaleString()}</span>
            <span className="text-muted-foreground ml-1 uppercase text-[10px] tracking-wide">Members</span>
          </div>
          <div className="text-right">
            <span className={`font-semibold text-[10px] ${activity.color}`}>● {activity.label}</span>
            <p className="text-muted-foreground text-[10px]">{group.post_count_today} posts today</p>
          </div>
        </div>

        <Button
          variant={group.is_member ? "outline" : "outline"}
          size="sm"
          className={`w-full text-xs ${group.is_member ? "text-muted-foreground" : "text-primary border-primary hover:bg-primary hover:text-primary-foreground"}`}
          onClick={(e) => { e.stopPropagation(); group.is_member ? onLeave(group.id) : onJoin(group.id); }}
        >
          {group.is_member ? "Leave Group" : group.is_private ? "Request to Join" : "Join Group"}
        </Button>
      </div>
    </div>
  );
};

export default GroupCard;
