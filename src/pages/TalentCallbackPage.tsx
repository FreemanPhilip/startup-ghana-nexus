import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { consumeTalentSsoState } from "@/lib/talentSso";

// Landing point for the SparkX Talent hand-off. Talent redirects here with a
// short-lived signed assertion in the URL *fragment* (not the query string, so
// it stays out of server logs and Referer headers). We verify it server-side
// via talent-sso-callback and exchange the result for a session.

const TalentCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // React 18 StrictMode double-invokes effects in dev; the assertion is
  // single-use, so a second redemption would fail. Run exactly once.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const token = fragment.get("token");
      const state = fragment.get("state");

      // Drop the assertion from the address bar as soon as it is read.
      window.history.replaceState(null, "", window.location.pathname);

      if (!token) {
        setError("That sign-in link is missing its token. Please try again.");
        return;
      }
      if (!consumeTalentSsoState(state)) {
        setError(
          "We couldn't verify this sign-in came from you. Please start again from the sign-in page.",
        );
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("talent-sso-callback", {
          body: { token },
        });

        if (fnError) {
          let message = "Could not sign in with SparkX Talent.";
          try {
            const body = await (fnError as { context?: Response }).context?.json();
            if (body?.error) message = body.error;
          } catch {
            /* keep the generic message */
          }
          setError(message);
          return;
        }

        if (!data?.token_hash) {
          setError("Could not sign in with SparkX Talent.");
          return;
        }

        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });
        if (otpError) {
          setError(otpError.message || "Could not complete sign-in.");
          return;
        }

        navigate("/dashboard", { replace: true });
      } catch {
        setError("Something went wrong completing sign-in. Please try again.");
      }
    })();
  }, [navigate]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-8 text-center shadow-2xl">
        {error ? (
          <>
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive/70" />
            <h1 className="font-display text-xl font-bold">Couldn't sign you in</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button
              className="mt-6 w-full bg-gradient-gold font-semibold text-navy hover:opacity-90"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-muted-foreground" />
            <h1 className="font-display text-xl font-bold">Signing you in…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Finishing up with your SparkX Talent account.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TalentCallbackPage;
