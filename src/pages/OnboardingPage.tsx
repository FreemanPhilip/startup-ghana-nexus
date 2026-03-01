import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getRoleDashboardPath } from "@/lib/roleRouting";
import OnboardingProfileStep from "@/components/onboarding/OnboardingProfileStep";
import OnboardingKYCStep from "@/components/onboarding/OnboardingKYCStep";
import OnboardingMembershipStep from "@/components/onboarding/OnboardingMembershipStep";
import type { Database } from "@/integrations/supabase/types";

type OnboardingStep = Database["public"]["Enums"]["onboarding_step"];

const STEP_ORDER: OnboardingStep[] = ["profile_details", "kyc", "subscription", "completed"];

const stepLabels: Record<string, string> = {
  profile_details: "Profile",
  kyc: "Verification",
  subscription: "Membership",
};

const OnboardingPage = () => {
  const { user, profile, roles, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Determine current step from profile
  const currentStep: OnboardingStep = profile?.onboarding_step || "role_selection";

  // If step is role_selection, move to profile_details (role was already selected at signup)
  useEffect(() => {
    if (user && currentStep === "role_selection") {
      supabase
        .from("profiles")
        .update({ onboarding_step: "profile_details" })
        .eq("user_id", user.id)
        .then(() => refreshProfile());
    }
  }, [user, currentStep]);

  // Handle Google OAuth role assignment
  useEffect(() => {
    const pendingRole = localStorage.getItem("pending_role");
    if (pendingRole && user && roles.length === 0) {
      supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: pendingRole as any })
        .then(({ error }) => {
          if (!error) {
            localStorage.removeItem("pending_role");
            refreshProfile();
          }
        });
    }
  }, [user, roles.length]);

  // If completed, redirect
  useEffect(() => {
    if (profile?.onboarding_step === "completed") {
      navigate(getRoleDashboardPath(roles[0]), { replace: true });
    }
  }, [profile?.onboarding_step, roles, navigate]);

  const advanceStep = async (nextStep: OnboardingStep) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_step: nextStep })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      if (nextStep === "completed") {
        toast.success("Welcome to GSE! 🎉");
        navigate(getRoleDashboardPath(roles[0]), { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(currentStep === "role_selection" ? "profile_details" : currentStep);
  const displaySteps = STEP_ORDER.filter(s => s !== "completed");

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      <div className="container flex flex-col items-center justify-center py-12">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-5 w-5 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground">GSE Portal</span>
        </motion.div>

        {/* Progress indicator */}
        <div className="mb-8 flex items-center gap-2">
          {displaySteps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= stepIndex ? "bg-gold text-navy" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className={`hidden sm:inline text-xs font-medium ${
                i <= stepIndex ? "text-gold" : "text-muted-foreground"
              }`}>
                {stepLabels[step]}
              </span>
              {i < displaySteps.length - 1 && (
                <div className={`h-px w-8 ${i < stepIndex ? "bg-gold" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {(currentStep === "profile_details" || currentStep === "role_selection") && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OnboardingProfileStep onNext={() => advanceStep("kyc")} saving={saving} />
            </motion.div>
          )}
          {currentStep === "kyc" && (
            <motion.div key="kyc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OnboardingKYCStep onNext={() => advanceStep("subscription")} onSkip={() => advanceStep("subscription")} saving={saving} />
            </motion.div>
          )}
          {currentStep === "subscription" && (
            <motion.div key="membership" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OnboardingMembershipStep onNext={() => advanceStep("completed")} saving={saving} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
