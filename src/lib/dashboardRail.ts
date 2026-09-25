import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/** Which dashboard the rail is sitting in. */
export type RailRole = Extract<
  AppRole,
  "startup_founder" | "mentor" | "investor" | "ecosystem_partner"
>;

/**
 * What a rail button does. Two of them open a dialog that lives in the rail
 * itself; the rest switch the dashboard's tab, which is why the tab ids have
 * to match the dashboard the rail is rendered in — sending an investor to
 * "my-sessions" is a dead click, because that dashboard has no such tab.
 */
export type RailTarget =
  | { kind: "tab"; tab: string }
  | { kind: "dialog"; dialog: "browse-people" | "ai-match" };

export interface RailAction {
  label: string;
  icon: "sparkles" | "search" | "calendar" | "users" | "compass" | "briefcase";
  emphasis: "primary" | "secondary";
  target: RailTarget;
}

export interface RailConfig {
  upcoming: {
    title: string;
    /** Shown when there is nothing booked. */
    empty: string;
    /** Tab behind the "All" link, or null to hide it where no such tab exists. */
    allTab: string | null;
    actions: RailAction[];
  };
  /**
   * The progress card, or null where every figure on it would be structurally
   * zero. An investor has no mentorship funnel; a card reading 0 / 20 forever
   * is not a summary, it is furniture.
   */
  progress: {
    title: string;
    /** Whose side of a booking the figures count. */
    side: "mentor" | "mentee";
    hoursLabel: string;
    hoursGoal: number;
    countLabel: string;
    /** Distinct mentor expertise for a mentee; distinct people for a mentor. */
    peerLabel: string;
  } | null;
}

const FOUNDER: RailConfig = {
  upcoming: {
    title: "Upcoming",
    empty: "Nothing booked",
    allTab: "my-sessions",
    actions: [
      { label: "Browse", icon: "search", emphasis: "secondary", target: { kind: "dialog", dialog: "browse-people" } },
      { label: "Match me", icon: "sparkles", emphasis: "primary", target: { kind: "dialog", dialog: "ai-match" } },
    ],
  },
  progress: {
    title: "Progress",
    side: "mentee",
    hoursLabel: "Hours",
    hoursGoal: 20,
    countLabel: "Sessions",
    peerLabel: "Skill areas",
  },
};

const MENTOR: RailConfig = {
  upcoming: {
    title: "Upcoming",
    empty: "No sessions booked",
    allTab: "my-sessions",
    // A mentor does not shop for mentors — Browse shows them founders (see
    // browseAudience). The other move is opening up more time.
    actions: [
      { label: "Browse", icon: "search", emphasis: "secondary", target: { kind: "dialog", dialog: "browse-people" } },
      { label: "Availability", icon: "calendar", emphasis: "primary", target: { kind: "tab", tab: "availability" } },
    ],
  },
  progress: {
    title: "Mentoring",
    side: "mentor",
    hoursLabel: "Hours given",
    hoursGoal: 20,
    countLabel: "Sessions",
    peerLabel: "Mentees",
  },
};

const INVESTOR: RailConfig = {
  upcoming: {
    title: "Upcoming",
    empty: "Nothing booked",
    // This dashboard has no sessions tab, so there is nowhere for "All" to go.
    allTab: null,
    actions: [
      { label: "Browse", icon: "search", emphasis: "secondary", target: { kind: "dialog", dialog: "browse-people" } },
      { label: "Discover", icon: "compass", emphasis: "primary", target: { kind: "tab", tab: "discover" } },
    ],
  },
  progress: null,
};

const PARTNER: RailConfig = {
  upcoming: {
    title: "Upcoming",
    empty: "Nothing booked",
    allTab: null,
    actions: [
      { label: "Browse", icon: "search", emphasis: "secondary", target: { kind: "dialog", dialog: "browse-people" } },
      { label: "Programs", icon: "calendar", emphasis: "primary", target: { kind: "tab", tab: "programs" } },
    ],
  },
  progress: null,
};

const BY_ROLE: Record<RailRole, RailConfig> = {
  startup_founder: FOUNDER,
  mentor: MENTOR,
  investor: INVESTOR,
  ecosystem_partner: PARTNER,
};

/**
 * The rail for a given dashboard.
 *
 * Falls back to the founder rail, which is the one whose actions are dialogs
 * rather than tabs — so an unrecognised role gets buttons that still work
 * rather than buttons that navigate nowhere.
 */
export function railConfig(role: RailRole | null | undefined): RailConfig {
  return (role && BY_ROLE[role]) || FOUNDER;
}
