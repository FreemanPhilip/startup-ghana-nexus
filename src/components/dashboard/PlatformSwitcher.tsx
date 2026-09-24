import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import SparkXLogo from "@/components/SparkXLogo";
import { CURRENT_PLATFORM, platforms, type Platform, type PlatformId } from "@/lib/platforms";

/**
 * The square app mark. Index shows the real SparkX spark; Talent has no
 * artwork in this repo, so it falls back to a monogram tile rather than
 * borrowing Index's logo and making the two platforms look like one.
 */
const Mark = ({ platform }: { platform: Platform }) => (
  <span
    aria-hidden="true"
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${platform.markClass}`}
  >
    {platform.id === "index" ? <SparkXLogo variant="mark" className="h-4 w-4" alt="" /> : platform.monogram}
  </span>
);

const Details = ({ platform }: { platform: Platform }) => (
  <span className="min-w-0 flex-1">
    <span className="block truncate text-sm font-medium leading-tight">{platform.name}</span>
    <span className="block truncate text-xs leading-tight text-muted-foreground">{platform.description}</span>
  </span>
);

interface PlatformSwitcherProps {
  current?: PlatformId;
}

/**
 * Move between SparkX Index and SparkX Talent from the profile menu.
 *
 * The platform you are already on is rendered as plain text rather than a menu
 * item: activating it would close the menu and navigate nowhere, so it should
 * not be a keyboard or pointer target. The other platform is a real anchor, so
 * middle-click and cmd-click open it in a new tab while a plain click switches
 * in place — which is what "switch" means.
 */
const PlatformSwitcher = ({ current = CURRENT_PLATFORM }: PlatformSwitcherProps) => (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
      <LayoutGrid className="h-3 w-3" /> Switch platform
    </DropdownMenuLabel>

    {platforms().map((platform) =>
      platform.id === current ? (
        <div key={platform.id} className="flex items-center gap-2.5 rounded-sm bg-primary/5 px-2 py-1.5">
          <Mark platform={platform} />
          <Details platform={platform} />
          <span className="shrink-0 text-xs font-medium text-primary">Current</span>
        </div>
      ) : (
        <DropdownMenuItem key={platform.id} asChild className="cursor-pointer gap-2.5 px-2 py-1.5">
          <a href={platform.href}>
            <Mark platform={platform} />
            <Details platform={platform} />
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </a>
        </DropdownMenuItem>
      ),
    )}
  </>
);

export default PlatformSwitcher;
