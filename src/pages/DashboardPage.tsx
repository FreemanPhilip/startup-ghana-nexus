import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Star, LogOut, User, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
              <Star className="h-5 w-5 text-navy" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold">AGS</span>
          </a>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your AGS dashboard — your central hub for connections, opportunities, and growth.
          </p>

          {/* Quick stats */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Role", value: roles[0]?.replace("_", " ") || "Not set", icon: User },
              { label: "Membership", value: profile?.membership || "standard", icon: Star },
              { label: "Verification", value: profile?.verification || "unverified", icon: Settings },
              { label: "Profile", value: profile?.onboarding_step === "completed" ? "Complete" : "Incomplete", icon: Bell },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <stat.icon className="h-4 w-4" />
                  <span className="text-sm">{stat.label}</span>
                </div>
                <p className="mt-2 font-display text-lg font-bold capitalize">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Placeholder sections */}
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-8">
              <h2 className="font-display text-xl font-bold">Your Feed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Follow startups and founders to see updates in your personalized feed. Coming soon!
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-8">
              <h2 className="font-display text-xl font-bold">Opportunities</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse funding calls, grants, and accelerator programs. Coming soon!
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
