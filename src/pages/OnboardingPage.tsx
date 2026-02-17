import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Rocket, TrendingUp, BookOpen, Building2, Wrench, Users, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleOptions: { value: AppRole; label: string; description: string; icon: any }[] = [
  { value: "startup_founder", label: "Startup Founder", description: "Build, fundraise, and scale your startup", icon: Rocket },
  { value: "investor", label: "Investor", description: "Discover and invest in promising startups", icon: TrendingUp },
  { value: "mentor", label: "Mentor", description: "Guide founders with your expertise", icon: BookOpen },
  { value: "ecosystem_partner", label: "Ecosystem Partner", description: "Accelerators, incubators, and VCs", icon: Building2 },
  { value: "service_provider", label: "Service Provider", description: "Offer services to the ecosystem", icon: Wrench },
  { value: "member", label: "Community Member", description: "Explore and engage with the ecosystem", icon: Users },
];

const membershipOptions = [
  { value: "standard" as const, label: "Standard", price: "Free", features: ["Basic profile", "Browse opportunities", "Community access"] },
  { value: "premium" as const, label: "Premium", price: "$29/mo", features: ["Verified badge", "Unlimited bookings", "Direct messaging", "Featured listing", "Priority support"] },
];

const OnboardingPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: role, 1: membership, 2: profile details
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [selectedMembership, setSelectedMembership] = useState<"standard" | "premium">("standard");
  const [profileData, setProfileData] = useState({
    headline: "",
    bio: "",
    location: "",
    linkedin_url: "",
    company_name: "",
    industry: "",
  });
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (step === 0 && !selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    // Final step - save everything
    if (!user) return;
    setSaving(true);
    try {
      // Save role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: selectedRole! });
      if (roleError) throw roleError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          headline: profileData.headline || null,
          bio: profileData.bio || null,
          location: profileData.location || null,
          linkedin_url: profileData.linkedin_url || null,
          company_name: profileData.company_name || null,
          industry: profileData.industry || null,
          membership: selectedMembership,
          onboarding_step: "completed",
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      await refreshProfile();
      toast.success("Welcome to AGS! 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const steps = ["Select Role", "Membership", "Your Profile"];

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      <div className="container flex flex-col items-center justify-center py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-5 w-5 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground">AGS</span>
        </motion.div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-gradient-gold text-navy" : "bg-primary-foreground/10 text-primary-foreground/40"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${i <= step ? "text-primary-foreground" : "text-primary-foreground/40"}`}>{s}</span>
              {i < steps.length - 1 && <div className="mx-2 h-px w-8 bg-primary-foreground/20" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <motion.div
          className="w-full max-w-2xl rounded-2xl border border-border/20 bg-card p-8 shadow-2xl"
          layout
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-2xl font-bold">What describes you best?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose your primary role in the ecosystem</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        selectedRole === role.value
                          ? "border-gold bg-gold/5 ring-2 ring-gold/30"
                          : "border-border hover:border-gold/30"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        selectedRole === role.value ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
                      }`}>
                        <role.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="membership" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-2xl font-bold">Choose your membership</h2>
                <p className="mt-1 text-sm text-muted-foreground">You can always upgrade later</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {membershipOptions.map((plan) => (
                    <button
                      key={plan.value}
                      onClick={() => setSelectedMembership(plan.value)}
                      className={`rounded-xl border p-6 text-left transition-all ${
                        selectedMembership === plan.value
                          ? "border-gold bg-gold/5 ring-2 ring-gold/30"
                          : "border-border hover:border-gold/30"
                      }`}
                    >
                      <p className="font-display text-lg font-bold">{plan.label}</p>
                      <p className="mt-1 font-display text-2xl font-bold text-gold">{plan.price}</p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-emerald" /> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-2xl font-bold">Complete your profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tell the community about yourself</p>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      placeholder="e.g. CEO at TechNova | Building the future of fintech"
                      value={profileData.headline}
                      onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="Accra, Ghana"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LinkedIn URL</Label>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={profileData.linkedin_url}
                        onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                      />
                    </div>
                  </div>
                  {(selectedRole === "startup_founder" || selectedRole === "ecosystem_partner") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                          placeholder="Your company"
                          value={profileData.company_name}
                          onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Industry</Label>
                        <Input
                          placeholder="e.g. Fintech, AgriTech"
                          value={profileData.industry}
                          onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-gradient-gold font-semibold text-navy hover:opacity-90"
            >
              {step === 2 ? (saving ? "Saving..." : "Complete Setup") : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
