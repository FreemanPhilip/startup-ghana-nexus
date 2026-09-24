import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SnapshotBarProps {
  icon: LucideIcon;
  /** Category accent class, e.g. accentClass("startup"). */
  accent: string;
  title: string;
  /** Short right-hand figure, e.g. "40% ready". Omit when there is none. */
  meta?: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

/**
 * The one-line prompt at the top of a dashboard's home tab.
 *
 * Founder and investor each had their own copy of this: an eyebrow in tracked
 * caps, a display heading, a paragraph of description, a percentage pill and a
 * button — five elements to say "do this next". One bar, one sentence, one
 * action, shared by both.
 *
 * It belongs to the home tab. Both copies used to sit outside the tab switch,
 * so a founder saw "Add your startup profile" hanging above Messages,
 * Settings and their own profile.
 */
const SnapshotBar = ({ icon: Icon, accent, title, meta, actionLabel, onAction }: SnapshotBarProps) => (
  <Card className="mb-5 flex flex-wrap items-center justify-between gap-4 p-4">
    <div className="flex min-w-0 items-center gap-3">
      <div className={`${accent} accent-tile h-10 w-10`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
        {meta && <p className="truncate text-[13px] text-muted-foreground">{meta}</p>}
      </div>
    </div>
    <Button size="sm" className="rounded-full px-5 font-medium" onClick={onAction}>
      {actionLabel}
    </Button>
  </Card>
);

export default SnapshotBar;
