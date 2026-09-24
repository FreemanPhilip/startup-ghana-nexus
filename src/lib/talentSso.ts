// Cross-app sign-in with SparkX Talent (talent.sparkxglobal.net).
//
// SparkX Talent runs on a separate Supabase project, so it cannot be added as
// an ordinary OAuth provider here. Instead we send the user to Talent's
// /sso/authorize page; it authenticates them and redirects back to
// TALENT_CALLBACK_PATH with a short-lived signed assertion in the URL fragment,
// which talent-sso-callback verifies.

const TALENT_ORIGIN = import.meta.env.VITE_TALENT_ORIGIN || "https://talent.sparkxglobal.net";
const PORTAL_ORIGIN = import.meta.env.VITE_PORTAL_ORIGIN || import.meta.env.VITE_APP_ORIGIN || "https://sparkxglobal.net";

export const TALENT_CALLBACK_PATH = "/auth/talent/callback";

/**
 * Where SparkX Talent lives. Exported so the platform switcher and the nav
 * link the same host the SSO hand-off uses — three hardcoded copies of the
 * URL is how a staging build ends up sending people to production.
 */
export function talentOrigin(): string {
  return TALENT_ORIGIN.replace(/\/$/, "");
}

const STATE_KEY = "talent-sso-state";

export function isTrustedPortalOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === "localhost" || hostname === "sparkxglobal.net" || hostname.endsWith(".sparkxglobal.net");
  } catch {
    return false;
  }
}

export function getPortalOrigin(): string {
  const configuredOrigin = (
    import.meta.env.VITE_PORTAL_ORIGIN ||
    import.meta.env.VITE_APP_ORIGIN ||
    (typeof window !== "undefined" ? window.location.origin : "https://sparkxglobal.net")
  )?.replace(/\/$/, "");

  if (configuredOrigin && isTrustedPortalOrigin(configuredOrigin)) {
    return configuredOrigin;
  }

  return "https://sparkxglobal.net";
}

/**
 * Where SparkX Talent begins an Index -> Talent switch.
 *
 * The switch cannot start here. Talent is the destination, so Talent has to be
 * the one that stores the CSRF state — sessionStorage is per-origin, and a
 * value written here would be invisible to the callback that has to check it.
 * So the switcher links to a small entry point on Talent, which either finds
 * an existing Talent session or turns around and asks this app for an
 * assertion. Either way the member lands on Talent signed in.
 */
export const TALENT_SWITCH_PATH = "/auth/sparkx-index/start";

export function talentSwitchUrl(): string {
  return `${talentOrigin()}${TALENT_SWITCH_PATH}`;
}

/** The exact callback URL — must be allowlisted on the Talent project. */
export function talentCallbackUrl(): string {
  return `${getPortalOrigin()}${TALENT_CALLBACK_PATH}`;
}

/**
 * Begin the hand-off. Generates a CSRF state value, stores it for the callback
 * to check, and returns the Talent URL to send the browser to.
 */
export function beginTalentSso(): string {
  const state = crypto.randomUUID();
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    // Storage unavailable (private mode). The flow still works; the callback
    // simply cannot verify state, and says so rather than signing anyone in.
  }
  const params = new URLSearchParams({
    redirect_uri: talentCallbackUrl(),
    state,
  });
  return `${TALENT_ORIGIN}/sso/authorize?${params.toString()}`;
}

/** Check and clear the stored state. False means the callback is not ours. */
export function consumeTalentSsoState(returned: string | null): boolean {
  try {
    const expected = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return !!expected && !!returned && expected === returned;
  } catch {
    return false;
  }
}
