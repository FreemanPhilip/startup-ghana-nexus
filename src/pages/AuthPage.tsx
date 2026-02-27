import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Mail, Lock, User, Eye, EyeOff, Rocket, TrendingUp, BookOpen, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleOptions: { value: AppRole; label: string; description: string; icon: any }[] = [
  { value: "startup_founder", label: "Startup Founder", description: "Build, fundraise, and scale your startup", icon: Rocket },
  { value: "investor", label: "Investor", description: "Discover and invest in promising startups", icon: TrendingUp },
  { value: "mentor", label: "Mentor", description: "Guide founders with your expertise", icon: BookOpen },
  { value: "ecosystem_partner", label: "Ecosystem Partner", description: "Accelerators, incubators, and organizations", icon: Building2 },
];

const AuthPage = () => {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (role: AppRole) => {
    setSelectedRole(role);
    setShowAuthForm(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole && isSignUp) {
      toast.error("Please select a role first");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, primary_role: selectedRole },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate("/onboarding");
        } else {
          toast.success("Check your email to confirm your account!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Login redirects are handled by ProtectedRoute / AuthContext
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!selectedRole) {
      toast.error("Please select a role first");
      return;
    }
    setLoading(true);
    try {
      // Store role in localStorage for Google OAuth (metadata can't be passed via OAuth)
      localStorage.setItem("pending_role", selectedRole);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/onboarding",
      });
      if (result.error) throw result.error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="dark flex min-h-screen bg-gradient-hero">
      {/* Left decorative panel */}
      <div className="hidden w-1/2 items-center justify-center lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md px-12"
        >
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold">
            <Star className="h-7 w-7 text-navy" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
            Join Ghana's Startup Ecosystem
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect with investors, find mentors, and access opportunities that
            accelerate your growth.
          </p>
          <div className="mt-10 space-y-4">
            {["500+ Startups Connected", "200+ Active Investors", "GH₵25M+ Funding Raised"].map((stat) => (
              <div key={stat} className="flex items-center gap-3 text-foreground/70">
                <div className="h-2 w-2 rounded-full bg-gold" />
                <span className="text-sm">{stat}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <AnimatePresence mode="wait">
          {!showAuthForm ? (
            /* STEP 1: Role Selection */
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
                <div className="mb-6 flex items-center gap-2 lg:hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
                    <Star className="h-5 w-5 text-navy" fill="currentColor" />
                  </div>
                  <span className="font-display text-xl font-bold">GSE</span>
                </div>

                <h2 className="font-display text-2xl font-bold">How will you use GSE?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select your primary role in the ecosystem
                </p>

                <div className="mt-6 space-y-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className="flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition-all hover:border-gold/50 hover:bg-gold/5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <role.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => { setShowAuthForm(true); setIsSignUp(false); }}
                    className="font-semibold text-gold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Auth Form */
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
                <div className="mb-6 flex items-center gap-2 lg:hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
                    <Star className="h-5 w-5 text-navy" fill="currentColor" />
                  </div>
                  <span className="font-display text-xl font-bold">GSE</span>
                </div>

                {isSignUp && (
                  <button
                    onClick={() => setShowAuthForm(false)}
                    className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> Change role
                  </button>
                )}

                {isSignUp && selectedRole && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-sm">
                    <span className="text-gold">✦</span>
                    <span className="text-foreground/80">
                      Joining as <span className="font-semibold text-gold">{roleOptions.find(r => r.value === selectedRole)?.label}</span>
                    </span>
                  </div>
                )}

                <h2 className="font-display text-2xl font-bold">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isSignUp ? "Start your journey in Ghana's startup ecosystem" : "Sign in to continue"}
                </p>

                {/* Google OAuth — only for signup (needs role) or login */}
                {(isSignUp && selectedRole || !isSignUp) && (
                  <Button
                    variant="outline"
                    className="mt-6 w-full gap-2"
                    onClick={isSignUp ? handleGoogleAuth : async () => {
                      // For login, Google doesn't need role
                      setLoading(true);
                      try {
                        const result = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin + "/dashboard",
                        });
                        if (result.error) throw result.error;
                      } catch (error: any) {
                        toast.error(error.message || "Failed to sign in with Google");
                        setLoading(false);
                      }
                    }}
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
                )}

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
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-gold font-semibold text-navy hover:opacity-90"
                  >
                    {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      if (isSignUp) {
                        // switching to login — no role needed
                      } else {
                        // switching to signup — go back to role select
                        setShowAuthForm(false);
                      }
                    }}
                    className="font-semibold text-gold hover:underline"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                By continuing, you agree to GSE's Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
