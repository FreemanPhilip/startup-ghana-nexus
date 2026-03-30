import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/auditLog";

const AdminAuthPage = () => {
  const { session, roles, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token");
  const [mode, setMode] = useState<"login" | "signup" | "change_password">(inviteToken ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(inviteToken ? null : true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [noAdminsExist, setNoAdminsExist] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in as admin (but not if they need to change password)
  useEffect(() => {
    if (session && roles.includes("admin") && mode !== "change_password") {
      // Check if must change password
      const mustChange = session.user?.user_metadata?.must_change_password;
      if (mustChange) {
        setMode("change_password");
      } else {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [session, roles, navigate, mode]);

  // Check if any admins exist (for first-time setup)
  useEffect(() => {
    const checkAdmins = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin")
        .limit(1);
      if (!data || data.length === 0) {
        setNoAdminsExist(true);
        setMode("signup");
      }
    };
    if (!inviteToken) checkAdmins();
  }, [inviteToken]);

  // Validate invite token
  useEffect(() => {
    if (!inviteToken) return;
    const validate = async () => {
      const { data } = await supabase
        .from("admin_invitations")
        .select("email")
        .eq("token", inviteToken)
        .eq("status", "pending")
        .maybeSingle();
      if (data) {
        setInviteValid(true);
        setInviteEmail(data.email);
        setEmail(data.email);
      } else {
        setInviteValid(false);
      }
    };
    validate();
  }, [inviteToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Check if user needs to change password
      if (data.user?.user_metadata?.must_change_password) {
        setMode("change_password");
        toast.info("Please change your temporary password to continue.");
      } else {
        toast.success("Welcome back, Admin!");
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false },
      });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const isFirstSetup = noAdminsExist;
    if (!isFirstSetup && (!inviteToken || !inviteValid)) {
      toast.error("You need a valid invitation to create an admin account.");
      return;
    }
    setLoading(true);
    try {
      const signupEmail = isFirstSetup ? email : inviteEmail;
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          data: { full_name: fullName || signupEmail.split("@")[0], primary_role: "admin" },
          emailRedirectTo: window.location.origin + "/admin/login",
        },
      });
      if (error) throw error;

      if (data.session) {
        if (inviteToken) {
          await supabase
            .from("admin_invitations")
            .update({ status: "accepted", accepted_at: new Date().toISOString() })
            .eq("token", inviteToken);
        }
        
        await supabase
          .from("profiles")
          .update({ onboarding_step: "completed", full_name: fullName || signupEmail.split("@")[0] })
          .eq("user_id", data.session.user.id);

        toast.success("Admin account created successfully!");
        navigate("/admin/dashboard");
      } else {
        toast.success("Check your email to confirm your admin account!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (inviteToken && inviteValid === null) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (inviteToken && inviteValid === false) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero px-6">
        <div className="max-w-md text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">This invitation link is invalid or has already been used.</p>
          <Button onClick={() => navigate("/admin/login")} variant="outline">Go to Admin Login</Button>
        </div>
      </div>
    );
  }

  const renderChangePasswordForm = () => (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
          <Key className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Change Password</h2>
          <p className="text-xs text-muted-foreground">Update your temporary password</p>
        </div>
      </div>

      <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 mb-4">
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          You're using a temporary password. Please set a new password to secure your account.
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmNewPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="pl-10"
              required
              minLength={6}
            />
          </div>
          {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button type="submit" disabled={loading || (newPassword !== confirmNewPassword)} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90">
          {loading ? "Updating..." : "Set New Password"}
        </Button>
      </form>
    </>
  );

  const renderAuthForm = () => (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Admin Portal</h2>
          <p className="text-xs text-muted-foreground">SparkX Index Administration</p>
        </div>
      </div>

      <h3 className="font-display text-lg font-semibold mb-1">
        {mode === "signup" ? "Create Admin Account" : "Admin Sign In"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {mode === "signup" ? "Complete your admin account setup" : "Sign in with your admin credentials"}
      </p>

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="fullName" placeholder="Admin Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
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
              placeholder="admin@sparkxindex.com"
              value={mode === "signup" && inviteToken ? inviteEmail : email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              readOnly={mode === "signup" && !!inviteToken}
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
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mode === "signup" && <p className="text-xs text-muted-foreground">Minimum 6 characters</p>}
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90">
          {loading ? "Please wait..." : mode === "signup" ? "Create Admin Account" : "Sign In"}
        </Button>
      </form>

      {!inviteToken && !noAdminsExist && mode === "login" && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Admin accounts are invitation-only. Contact a super admin for access.
        </p>
      )}

      {noAdminsExist && mode === "signup" && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          First-time setup — create the super admin account.
        </p>
      )}

      {mode === "signup" && !noAdminsExist && (
        <button onClick={() => setMode("login")} className="mt-3 w-full text-center text-sm text-primary hover:underline">
          Already have an admin account? Sign In
        </button>
      )}
      {mode === "login" && (
        <button onClick={() => setMode("signup")} className="mt-3 w-full text-center text-sm text-primary hover:underline">
          Have an invitation? Create Account
        </button>
      )}
    </>
  );

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
          {mode === "change_password" ? renderChangePasswordForm() : renderAuthForm()}
        </div>

        <button onClick={() => navigate("/")} className="mt-4 flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to SparkX Index
        </button>
      </motion.div>
    </div>
  );
};

export default AdminAuthPage;
