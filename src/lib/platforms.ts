import { getPortalOrigin, talentOrigin } from "@/lib/talentSso";

export type PlatformId = "index" | "talent";

export interface Platform {
  id: PlatformId;
  name: string;
  /** One line saying what this platform is for, shown under the name. */
  description: string;
  href: string;
  /**
   * Letter shown in the app mark. SparkX Index renders its real logo instead;
   * Talent has no artwork in this repo, so it falls back to a monogram tile.
   */
  monogram: string;
  /** Tailwind classes for the monogram tile. */
  markClass: string;
}

/** Which platform this build is. */
export const CURRENT_PLATFORM: PlatformId = "index";

/**
 * The SparkX platforms a signed-in member can move between.
 *
 * A function rather than a constant because the Index href depends on
 * getPortalOrigin(), which reads window.location on a preview deployment —
 * evaluating it at module load would pin the wrong origin.
 */
export function platforms(): Platform[] {
  return [
    {
      id: "index",
      name: "SparkX Index",
      description: "Ecosystem & mentorship",
      href: getPortalOrigin(),
      monogram: "X",
      // A neutral tile, not a brand gradient: the real spark is orange-on-black
      // artwork and needs a plain surface behind it to read.
      markClass: "border border-border bg-background",
    },
    {
      id: "talent",
      name: "SparkX Talent",
      description: "Jobs & vetted talent",
      href: talentOrigin(),
      monogram: "T",
      markClass: "bg-gradient-emerald text-white",
    },
  ];
}

/** The platform the user is not currently on — what the switcher offers. */
export function otherPlatforms(current: PlatformId = CURRENT_PLATFORM): Platform[] {
  return platforms().filter((p) => p.id !== current);
}
