const KEY = "sparkx-pending-sso";

/**
 * A cross-platform hand-off that arrived while signed out.
 *
 * /sso/authorize parks the request here and sends the visitor to /auth; once
 * they sign in, AuthPage sends them back to finish the hand-off instead of
 * dropping them on the dashboard. Without this, choosing "switch to Talent"
 * while logged out ends on the wrong screen and the switch is simply lost.
 *
 * Same-origin only and single-use: the value is cleared as it is read, so a
 * stale entry cannot hijack a later ordinary sign-in.
 */
export function setPendingSso(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* private mode — the hand-off is lost, ordinary sign-in still works */
  }
}

export function takePendingSso(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    // Only ever an in-app path. Anything absolute or protocol-relative would
    // turn this into an open redirect.
    if (!value || !value.startsWith("/sso/authorize") || value.startsWith("//")) return null;
    return value;
  } catch {
    return null;
  }
}
