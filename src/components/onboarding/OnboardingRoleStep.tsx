import { useState } from "react";
import { Rocket, TrendingUp, BookOpen, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Props {
  onNext: () => void;
  saving: boolean;
}

const roleOptions: { value: AppRole; label: string; description: string; icon: any }[] = [
  { value: "startup_founder", label: "Startup Founder", description: "Build, fundraise, and scale your startup", icon: Rocket },
  { value: "investor", label: "Investor", description: "Discover and invest in promising startups", icon: TrendingUp },
  { value: "mentor", label: "Mentor", description: "Guide founders with your expertise", icon: BookOpen },
  { value: "ecosystem_partner", label: "Ecosystem Partner", description: "Accelerators, incubators, and organizations", icon: Building2 },
];

const OnboardingRoleStep = ({ onNext, saving: parentSaving }: Props) => {
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<AppRole | null>(null);
  const [localSaving, setLocalSaving] = useState(false);

  const handleContinue = async () => {
    if (!user || !selected) return;
    setLocalSaving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: selected });
      if (error) throw error;
      await refreshProfile();
      onNext();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLocalSaving(false);
    }
  };

  const isSaving = localSaving || parentSaving;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
      <h2 className="font-display text-2xl font-bold">How will you use GSE?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select your role in the ecosystem</p>

      <div className="mt-6 space-y-3">
        {roleOptions.map((role) => (
          <button
            key={role.value}
            onClick={() => setSelected(role.value)}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
              selected === role.value
                ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                : "border-border hover:border-gold/50 hover:bg-gold/5"
            }`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
              selected === role.value ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
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

      <Button
        onClick={handleContinue}
        disabled={!selected || isSaving}
        className="mt-8 w-full bg-gradient-gold font-semibold text-navy hover:opacity-90"
      >
        {isSaving ? "Saving..." : "Continue →"}
      </Button>
    </div>
  );
};

export default OnboardingRoleStep;
