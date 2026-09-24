/**
 * One hue per domain of the product.
 *
 * The dashboard was almost entirely one blue, which made every screen look
 * the same and gave the eye nothing to navigate by. Rather than decorating
 * with colour, each domain keeps its own hue wherever it appears — a
 * mentorship tile is violet in the sidebar, in the feed and in the right rail
 * — so colour becomes a wayfinding cue.
 *
 * The values live in index.css as .a-* classes (light and dark pairs, all
 * measured at 4.5:1 or better against --background). This maps the product's
 * vocabulary onto them so call sites never hardcode a hue.
 */
export type Category =
  | "network"
  | "mentor"
  | "funding"
  | "opportunity"
  | "startup"
  | "investor";

const CLASS: Record<Category, string> = {
  network: "a-network",
  mentor: "a-mentor",
  funding: "a-funding",
  opportunity: "a-opportunity",
  startup: "a-startup",
  investor: "a-investor",
};

/** Maps the dashboard's tab ids onto a category. */
const TAB_CATEGORY: Record<string, Category> = {
  home: "network",
  network: "network",
  groups: "network",
  messages: "network",
  mentors: "mentor",
  "mentor-briefing": "mentor",
  "my-sessions": "mentor",
  mentees: "mentor",
  availability: "mentor",
  investors: "investor",
  opportunities: "opportunity",
  "my-startups": "startup",
  startups: "startup",
  funding: "funding",
};

export function accentClass(category: Category): string {
  return CLASS[category];
}

/** The accent for a sidebar tab, falling back to the house blue. */
export function tabAccent(tabId: string): string {
  return CLASS[TAB_CATEGORY[tabId] ?? "network"];
}
