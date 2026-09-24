import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SparkXLogo from "@/components/SparkXLogo";
import { takePendingSso } from "@/lib/pendingSso";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { beginTalentSso } from "@/lib/talentSso";
import { getPostAuthRoute, sanitizeAppPath } from "@/lib/roleRouting";

const AuthPage = () => {
  const { session, profile, roles, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect authenticated users away from auth page without flashing the landing page
  useEffect(() => {
    if (authLoading) return;
    if (!session) return;
    // A platform hand-off parked before sign-in wins over the usual landing
    // route: the member asked to switch platforms, not to visit a dashboard.
    const pending = takePendingSso();
    navigate(pending ?? sanitizeAppPath(getPostAuthRoute(roles, profile)), { replace: true });
  }, [session, profile, roles, authLoading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate(sanitizeAppPath("/dashboard"), { replace: true });
        } else {
          toast.success("Check your email to confirm your account!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(sanitizeAppPath("/dashboard"), { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hands off to talent.sparkxglobal.net. SparkX Talent is a separate Supabase
  // project, so it can't be a normal OAuth provider: it authenticates the user
  // itself and redirects back to /auth/talent/callback with a signed assertion.
  // This app never sees the user's Talent password.
  const handleTalentAuth = () => {
    setLoading(true);
    window.location.href = beginTalentSso();
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="dark flex min-h-screen bg-gradient-hero text-foreground">
      {/* Left decorative panel */}
      <div className="hidden w-1/2 items-center justify-center lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md px-12"
        >
          <SparkXLogo tone="dark" className="mb-8 h-10" />
          <h1 className="display-lg">
            Join Africa's Startup Ecosystem
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect with investors, find mentors, and access opportunities that
            accelerate your growth.
          </p>
          <div className="mt-10 space-y-4">
            {["500+ Startups Connected", "200+ Active Investors", "$25M+ Funding Raised"].map((stat) => (
              <div key={stat} className="flex items-center gap-3 text-foreground/70">
                <div className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-sm">{stat}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — Auth Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <SparkXLogo tone="dark" className="h-8" />
            </div>

            <h2 className="font-display text-2xl font-bold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? "Start your journey in Africa's startup ecosystem" : "Sign in to continue"}
            </p>

            {/* SparkX Talent first: it is a first-party SparkX account, so for
                anyone already in the ecosystem it is the shortest way in.
                Talent runs on a separate Supabase project, which is why this
                is a redirect hand-off rather than an OAuth provider. */}
            <Button
              variant="outline"
              className="mt-6 h-11 w-full justify-center gap-2.5 rounded-xl border-border/60 text-[15px] font-medium hover:border-brand/60"
              onClick={handleTalentAuth}
              disabled={loading}
            >
              <SparkXLogo variant="mark" className="h-4 w-4" alt="" />
              Continue with SparkX Talent
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Already on SparkX Talent? You{"\u2019"}ll be signed straight in.
            </p>

            {/* Google OAuth */}
            <Button
              variant="outline"
              className="mt-3 h-11 w-full justify-center gap-2.5 rounded-xl border-border/60 text-[15px] font-medium"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Kwame Asante"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  {/* The icon is 16px; the hit area is 40 so a thumb can find
                      it. Inset rather than padded so it still sits inside the
                      field's right edge. */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-brand font-semibold text-white hover:opacity-90"
              >
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-brand hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to SparkX Index's Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
