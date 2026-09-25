import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SparkXLogo from "@/components/SparkXLogo";
import { Button } from "@/components/ui/button";
import { setPendingSso } from "@/lib/pendingSso";

/**
 * Hand-off point when SparkX Talent asks whether this visitor holds a SparkX
 * Index account.
 *
 * Talent sends them here with a redirect_uri and a state value. If they are
 * signed in, we mint a short-lived signed assertion and bounce straight back —
 * no button, no confirmation screen. Switching between two surfaces of the
 * same product should feel like moving between tabs, not like authorising a
 * third-party app.
 *
 * What makes that safe is the allowlist: the edge function only ever issues an
 * assertion to a redirect_uri it has been configured with, so a crafted link
 * cannot carry one somewhere we do not control. The account holder is already
 * authenticated here, and the destination is a first-party SparkX property.
 *
 * If they are signed out, they go to /auth and land back here afterwards.
 */
const SsoAuthorizePage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();

  const redirectUri = params.get("redirect_uri");
  const state = params.get("state");

  const [error, setError] = useState("");
  // The effect can run twice under StrictMode; an assertion is single-use, so
  // minting a second one would burn a token for nothing.
  const startedRef = useRef(false);

  const handOff = useCallback(async () => {
    if (!redirectUri) return;
    try {
      const { data, error: fnError } = await supabase.functions.invoke("sso-issue-token", {
        body: { redirect_uri: redirectUri },
      });

      if (fnError) {
        let message = "Couldn't complete the hand-off. Please try again.";
        try {
          const body = await (fnError as { context?: Response }).context?.json();
          if (body?.error) message = body.error;
        } catch {
          /* keep the generic message */
        }
        setError(message);
        return;
      }

      if (!data?.token) {
        setError("Couldn't complete the hand-off. Please try again.");
        return;
      }

      const fragment = new URLSearchParams({ token: data.token });
      if (state) fragment.set("state", state);
      // replace(), not assign(): the assertion must not sit in history.
      window.location.replace(`${redirectUri}#${fragment.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }, [redirectUri, state]);

  useEffect(() => {
    if (loading || !redirectUri || startedRef.current) return;

    if (!user) {
      // Park the request so /auth can send them back here once signed in.
      setPendingSso(window.location.pathname + window.location.search);
      navigate("/auth", { replace: true });
      return;
    }

    startedRef.current = true;
    void handOff();
  }, [loading, user, redirectUri, navigate, handOff]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero px-6 text-foreground">
      <div className="w-full max-w-sm text-center">
        <Link to="/" aria-label="SparkX home" className="inline-flex">
          <SparkXLogo tone="dark" className="h-8" />
        </Link>

        {!redirectUri ? (
          <>
            <p className="mt-8 text-[15px] font-medium">Nothing to authorise</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This page opens from SparkX Talent when you choose to continue with your SparkX Index
              account.
            </p>
          </>
        ) : error ? (
          <>
            <p className="mt-8 text-[15px] font-medium">Couldn't continue</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
            <Button
              className="mt-6 rounded-full px-6 font-medium"
              onClick={() => {
                setError("");
                void handOff();
              }}
            >
              Try again
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-[15px] font-medium">Taking you to SparkX Talent</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {user?.email ? `Signed in as ${user.email}.` : "One moment."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SsoAuthorizePage;
