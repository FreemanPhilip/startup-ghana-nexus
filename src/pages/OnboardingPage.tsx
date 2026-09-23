import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPostAuthRoute, getPrimaryDashboardRole } from "@/lib/roleRouting";
import OnboardingRoleStep from "@/components/onboarding/OnboardingRoleStep";
import OnboardingProfileStep from "@/components/onboarding/OnboardingProfileStep";
import OnboardingKYCStep from "@/components/onboarding/OnboardingKYCStep";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import type { Database } from "@/integrations/supabase/types";

type OnboardingStep = Database["public"]["Enums"]["onboarding_step"];

// "subscription" is intentionally absent: membership selection was removed from
// onboarding. The enum value still exists in the database, so anyone who was
// parked on that step is migrated to "completed" below rather than stranded on
// a screen that no longer renders.
const STEP_ORDER: OnboardingStep[] = ["role_selection", "profile_details", "kyc", "completed"];

const stepLabels: Record<string, string> = {
  role_selection: "Role",
  profile_details: "Profile",
  kyc: "Verification",
};

const OnboardingPage = () => {
  const { user, profile, roles, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const currentStep: OnboardingStep = profile?.onboarding_step || "role_selection";

  // Membership was removed from onboarding. Anyone whose profile still points at
  // that step would otherwise land on a screen that no longer renders, so finish
  // the flow for them.
  useEffect(() => {
    if (!user || currentStep !== "subscription") return;
    supabase
      .from("profiles")
      .update({ onboarding_step: "completed" })
      .eq("user_id", user.id)
      .then(() => refreshProfile());
  }, [user, currentStep, refreshProfile]);

  // If roles already assigned (e.g. from old signup with primary_role metadata), skip role_selection
  useEffect(() => {
    if (user && currentStep === "role_selection" && roles.length > 0) {
      supabase
        .from("profiles")
        .update({ onboarding_step: "profile_details" })
        .eq("user_id", user.id)
        .then(() => refreshProfile());
    }
  }, [user, currentStep, roles.length]);

  // Handle Google OAuth role assignment (stored in localStorage from old flow)
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

  // If completed, redirect to the member's dashboard — unless they have no
  // dashboard-capable role (role revoked/never assigned), in which case send
  // them back to role selection instead of showing a blank page.
  useEffect(() => {
    if (profile?.onboarding_step === "completed") {
      const primary = getPrimaryDashboardRole(roles);
      if (primary) {
        navigate(getPostAuthRoute(roles, profile), { replace: true });
      } else if (user) {
        supabase
          .from("profiles")
          .update({ onboarding_step: "role_selection" })
          .eq("user_id", user.id)
          .then(() => refreshProfile());
      }
    }
  }, [profile?.onboarding_step, roles, user, navigate, refreshProfile]);

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
        toast.success("Welcome to SparkX Index! 🎉");
        const primary = getPrimaryDashboardRole(roles);
        if (primary) {
          navigate(getPostAuthRoute(roles, { onboarding_step: "completed" }), { replace: true });
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const displaySteps = STEP_ORDER.filter(s => s !== "completed");

  // Forced dark, matching AuthPage and the SSO callback: onboarding follows
  // straight on from sign-up, so the surface should not change appearance
  // halfway through. Without this the card rendered light on the dark gradient
  // for anyone not already on the dark theme.
  return (
    <div className="dark flex min-h-screen bg-gradient-hero text-foreground">
      <div className="container flex flex-col items-center justify-center py-12">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-5 w-5 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground">SparkX Index</span>
        </motion.div>

        {/* Progress indicator */}
        <div className="mb-8 flex w-full justify-center">
          <OnboardingStepper
            steps={displaySteps.map((step) => ({ key: step, label: stepLabels[step] }))}
            currentIndex={stepIndex}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {currentStep === "role_selection" && roles.length === 0 && (
            <motion.div key="role" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OnboardingRoleStep onNext={() => advanceStep("profile_details")} saving={saving} />
            </motion.div>
          )}
          {currentStep === "profile_details" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OnboardingProfileStep onNext={() => advanceStep("kyc")} saving={saving} />
            </motion.div>
          )}
          {currentStep === "kyc" && (
            <motion.div key="kyc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <OnboardingKYCStep onNext={() => advanceStep("completed")} onSkip={() => advanceStep("completed")} onBack={() => advanceStep("profile_details")} saving={saving} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
