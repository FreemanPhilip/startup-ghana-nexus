import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SparkXLogo from "@/components/SparkXLogo";
import { useAuth } from "@/contexts/AuthContext";
import { beginTalentSso } from "@/lib/talentSso";
import { getPostAuthRoute, sanitizeAppPath } from "@/lib/roleRouting";

/**
 * Entry point for a member arriving from SparkX Talent's "Switch to SparkX
 * Index" menu item.
 *
 * It exists on this side rather than on Talent because the CSRF state has to
 * be written by the origin that will later check it, and sessionStorage does
 * not cross origins. So Talent links here, and this page decides:
 *
 *  - already signed in to Index -> straight to their landing route, no
 *    round-trip and no assertion spent;
 *  - otherwise -> hand off to Talent's /sso/authorize, which signs them in
 *    here with their Talent account via /auth/talent/callback.
 *
 * Either way the member never sees a second login form.
 */
const TalentSsoStartPage = () => {
  const navigate = useNavigate();
  const { session, profile, roles, loading } = useAuth();
  // One decision per visit: the redirect below unmounts the page, but an auth
  // state change landing first would otherwise fire it twice.
  const decidedRef = useRef(false);

  useEffect(() => {
    if (loading || decidedRef.current) return;
    decidedRef.current = true;

    if (session) {
      navigate(sanitizeAppPath(getPostAuthRoute(roles, profile)), { replace: true });
      return;
    }

    // replace(), not assign(): back from Talent should not re-enter the
    // hand-off and start it over.
    window.location.replace(beginTalentSso());
  }, [loading, session, profile, roles, navigate]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero px-6 text-foreground">
      <div className="w-full max-w-sm text-center">
        <Link to="/" aria-label="SparkX home" className="inline-flex">
          <SparkXLogo tone="dark" className="h-8" />
        </Link>
        <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-[15px] font-medium">Taking you to SparkX Index</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Signing you in with your SparkX account.
        </p>
      </div>
    </div>
  );
};

export default TalentSsoStartPage;
