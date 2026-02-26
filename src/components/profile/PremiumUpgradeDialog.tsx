import { useState } from "react";
import { Crown, Check, Loader2, Zap, Users, Search, MessageSquare, BarChart3, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { STRIPE_CONFIG } from "@/lib/stripe-config";

interface PremiumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  { icon: Users, label: "Unlimited connections", standard: "50 max", premium: "Unlimited" },
  { icon: MessageSquare, label: "Unlimited messaging", standard: "20/day", premium: "Unlimited" },
  { icon: Search, label: "Advanced search filters", standard: false, premium: true },
  { icon: Shield, label: "Investor contact details", standard: false, premium: true },
  { icon: Zap, label: "Featured listings", standard: false, premium: true },
  { icon: BarChart3, label: "Data export", standard: false, premium: true },
];

const PremiumUpgradeDialog = ({ open, onOpenChange }: PremiumUpgradeDialogProps) => {
  const { isPremium, subscription, checkSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          price_id: STRIPE_CONFIG.premium.price_id,
          mode: "subscription",
          success_path: "/dashboard?upgraded=true",
          cancel_path: "/dashboard",
        },
      });
      if (error) throw error;
      if (data?.error) {
        // Handle Stripe configuration errors gracefully
        if (data.error.includes("account or business name")) {
          toast({
            title: "Payment Setup Required",
            description: "The payment system is being configured. Please try again shortly or contact support.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
      } else if (data?.url) {
        window.open(data.url, "_blank");
        toast({ title: "Checkout opened", description: "Complete your payment in the new tab. Your membership will update automatically." });
        // Poll for subscription update
        const pollInterval = setInterval(async () => {
          await checkSubscription();
        }, 5000);
        setTimeout(() => clearInterval(pollInterval), 120000); // Stop after 2 min
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create checkout session", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to open portal", variant: "destructive" });
    }
    setManagingPortal(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> {isPremium ? "Premium Membership" : "Upgrade to Premium"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {isPremium ? (
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 text-center">
              <Badge className="bg-gradient-gold text-primary-foreground border-0 mb-2">Your Plan</Badge>
              <p className="text-sm font-semibold">Premium Member</p>
              {subscription.subscription_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews: {new Date(subscription.subscription_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-display font-bold">GH₵{STRIPE_CONFIG.premium.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground">Unlock the full potential of the ecosystem</p>
            </div>
          )}

          <div className="space-y-2">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-3 p-2.5 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.label}</p>
                </div>
                <div className="flex gap-6 text-xs shrink-0">
                  <span className="w-16 text-center text-muted-foreground">
                    {typeof f.standard === "boolean" ? (f.standard ? "✓" : "—") : f.standard}
                  </span>
                  <span className="w-16 text-center font-semibold text-primary">
                    {typeof f.premium === "boolean" ? <Check className="h-4 w-4 mx-auto text-primary" /> : f.premium}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-6 px-2.5 pb-1">
              <span className="w-16 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Standard</span>
              <span className="w-16 text-center text-[10px] font-bold uppercase tracking-wider text-primary">Premium</span>
            </div>
          </div>

          {isPremium ? (
            <Button variant="outline" className="w-full text-sm gap-1.5" onClick={handleManageSubscription} disabled={managingPortal}>
              {managingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Manage Subscription
            </Button>
          ) : (
            <Button className="w-full text-sm font-semibold gap-1.5 bg-gradient-gold hover:opacity-90 border-0" onClick={handleUpgrade} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              Upgrade to Premium — GH₵{STRIPE_CONFIG.premium.price}/mo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeDialog;
