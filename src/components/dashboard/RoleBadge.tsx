import { Rocket, TrendingUp, GraduationCap, Handshake, type LucideIcon } from "lucide-react";
import { accentClass, type Category } from "@/lib/categoryAccents";

/**
 * What a member is, said once.
 *
 * This vocabulary existed in three places — PostCard, RecommendedConnections
 * and ActiveMembers — each with its own label, icon and a hand-picked
 * Tailwind pair. They had drifted: a founder was emerald in one and a
 * different emerald in another, and each copy chose its own contrast.
 */
const ROLES: Record<string, { label: string; icon: LucideIcon; category: Category }> = {
  startup_founder: { label: "Founder", icon: Rocket, category: "startup" },
  investor: { label: "Investor", icon: TrendingUp, category: "investor" },
  mentor: { label: "Mentor", icon: GraduationCap, category: "mentor" },
  ecosystem_partner: { label: "Partner", icon: Handshake, category: "funding" },
};

interface RoleBadgeProps {
  role: string | null | undefined;
  /** "chip" is a tinted pill; "inline" is icon + word, for dense rows. */
  variant?: "chip" | "inline";
  className?: string;
}

const RoleBadge = ({ role, variant = "chip", className = "" }: RoleBadgeProps) => {
  const config = role ? ROLES[role] : undefined;
  if (!config) return null;

  const Icon = config.icon;
  const accent = accentClass(config.category);

  if (variant === "inline") {
    return (
      <span className={`${accent} accent-text flex shrink-0 items-center gap-0.5 text-[11px] font-medium ${className}`}>
        <Icon className="h-3 w-3" aria-hidden="true" />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`${accent} accent-tile inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {config.label}
    </span>
  );
};

export default RoleBadge;
