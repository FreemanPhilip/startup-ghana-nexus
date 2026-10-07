import type { Database } from "@/integrations/supabase/types";
import type { RailRole } from "@/lib/dashboardRail";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface BrowseAudience {
  /** Dialog heading. */
  title: string;
  /** One line under it saying who is in this list. */
  subtitle: string;
  searchPlaceholder: string;
  /** Nobody matched. */
  empty: string;
  /** Nobody matched the search text. */
  emptySearch: string;
  /** Discovery roles to show. Empty means everyone. */
  roles: AppRole[];
  /**
   * Only people who have set an availability window. Right for finding a
   * mentor to book; wrong for finding founders, who never set one — filtering
   * on it there would return an empty list forever.
   */
  availableOnly: boolean;
}

/** Someone who helps a startup grow. */
const MENTORS: BrowseAudience = {
  title: "Browse mentors",
  subtitle: "Operators and specialists offering sessions",
  searchPlaceholder: "Search by name, industry, or expertise…",
  empty: "No mentors are taking sessions yet",
  emptySearch: "No mentors match your search",
  roles: ["mentor"],
  availableOnly: true,
};

/** Someone building a company — who a mentor, investor or partner looks for. */
const FOUNDERS: BrowseAudience = {
  title: "Browse founders",
  subtitle: "People building companies in the ecosystem",
  searchPlaceholder: "Search by name, industry, or company…",
  empty: "No founders on the platform yet",
  emptySearch: "No founders match your search",
  roles: ["startup_founder"],
  availableOnly: false,
};

/** Everyone a partner might convene. */
const MEMBERS: BrowseAudience = {
  title: "Browse members",
  subtitle: "Founders, mentors and investors across the ecosystem",
  searchPlaceholder: "Search by name, industry, or expertise…",
  empty: "No members on the platform yet",
  emptySearch: "No members match your search",
  roles: ["startup_founder", "mentor", "investor"],
  availableOnly: false,
};

/**
 * Who each role browses.
 *
 * The dialog used to be hardcoded to mentors for everybody, so a mentor who
 * opened it was shown a list of other mentors — people in the same seat,
 * rather than the founders they are there to work with.
 */
const BY_ROLE: Record<RailRole, BrowseAudience> = {
  startup_founder: MENTORS,
  mentor: FOUNDERS,
  investor: FOUNDERS,
  ecosystem_partner: MEMBERS,
};

export function browseAudience(role: RailRole | null | undefined): BrowseAudience {
  return (role && BY_ROLE[role]) || MENTORS;
}
