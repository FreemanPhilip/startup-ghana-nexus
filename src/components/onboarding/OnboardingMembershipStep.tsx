import { useState } from "react";
import { Crown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STRIPE_CONFIG } from "@/lib/stripe-config";

interface Props {
  onNext: () => void;
  saving: boolean;
}

const standardFeatures = [
  "50 connections",
  "20 messages/day",
  "5 posts/day",
  "Basic search",
  "Join 5 groups",
];

const premiumFeatures = [
  "Unlimited connections",
  "Unlimited messaging",
  "Unlimited posts",
  "Advanced search & filters",
  "Investor contact details",
  "Featured listings",
  "Data export",
  "Priority support",
];

const OnboardingMembershipStep = ({ onNext, saving: parentSaving }: Props) => {
  const { isPremium } = useAuth();
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleUpgrade = async () => {
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          price_id: STRIPE_CONFIG.premium.price_id,
          mode: "subscription",
          success_path: "/onboarding?upgraded=true",
          cancel_path: "/onboarding",
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold">Choose Your Membership</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start free or unlock full access with Premium
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Standard Plan */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold">Standard</h3>
            <p className="text-2xl font-bold mt-1">Free</p>
            <p className="text-xs text-muted-foreground">Forever</p>
          </div>
          <ul className="space-y-2">
            {standardFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-muted-foreground/60" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            onClick={onNext}
            disabled={parentSaving}
            className="w-full"
          >
            {parentSaving ? "Please wait..." : "Continue with Standard"}
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="rounded-xl border-2 border-gold/50 bg-gold/5 p-5 space-y-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-gold px-3 py-0.5 text-[10px] font-bold text-navy uppercase">
              Recommended
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              <h3 className="font-display text-lg font-bold">Premium</h3>
            </div>
            <p className="text-2xl font-bold mt-1">
              ${STRIPE_CONFIG.premium.price}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <ul className="space-y-2">
            {premiumFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-gold" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            onClick={handleUpgrade}
            disabled={loadingCheckout || isPremium}
            className="w-full bg-gradient-gold font-semibold text-navy hover:opacity-90"
          >
            {loadingCheckout ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
            ) : isPremium ? (
              "Already Premium ✓"
            ) : (
              "Upgrade to Premium"
            )}
          </Button>
        </div>
      </div>

      {/* Skip / Continue */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        You can always upgrade later from your profile settings.
      </p>
    </div>
  );
};

export default OnboardingMembershipStep;
