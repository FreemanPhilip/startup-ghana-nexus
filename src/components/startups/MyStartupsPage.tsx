import { useState } from "react";
import { Building2, Plus, Users, ExternalLink, Edit, Loader2, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStartups } from "@/hooks/useStartups";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateStartup, startupCreationBlockedReason } from "@/lib/startupAccess";
import CreateStartupWizard from "./CreateStartupWizard";
import EditStartupDialog from "./EditStartupDialog";

const verificationBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <Badge className="bg-primary/10 text-primary gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>;
    case "premium_verified":
      return <Badge className="bg-gradient-brand text-white gap-1"><ShieldCheck className="h-3 w-3" /> Premium Verified</Badge>;
    default:
      return <Badge variant="secondary" className="gap-1"><ShieldAlert className="h-3 w-3" /> Pending</Badge>;
  }
};

interface MyStartupsPageProps {
  onViewStartup?: (id: string) => void;
}

const MyStartupsPage = ({ onViewStartup }: MyStartupsPageProps) => {
  const { myStartups, loading, refetch } = useStartups();
  const { roles } = useAuth();
  // Founding a company is a claim about who you are, not a button everyone
  // gets. The database enforces the same rule; this keeps the interface from
  // offering an action that would only be refused.
  const canCreate = canCreateStartup(roles);
  const blockedReason = startupCreationBlockedReason(roles);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editStartup, setEditStartup] = useState<typeof myStartups[0] | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">My Startups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canCreate ? "Manage your startup pages" : "Startups you've been added to"}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setWizardOpen(true)} className="gap-2 bg-gradient-brand text-white font-semibold hover:opacity-90">
            <Plus className="h-4 w-4" />
            Create New Startup
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : myStartups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">
            {canCreate ? "No startup pages yet" : "You're not on a startup yet"}
          </h3>
          <p className="mx-auto mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
            {blockedReason ?? "Create your startup's official presence in the ecosystem."}
          </p>
          {canCreate && (
            <Button onClick={() => setWizardOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Startup Page
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myStartups.map(startup => (
            <div key={startup.id} className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={startup.logo_url || undefined} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                    {startup.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{startup.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {[startup.industry, startup.stage, startup.location].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                {verificationBadge(startup.verification_status)}
              </div>

              {startup.short_description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{startup.short_description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {startup.member_count} team</span>
                  <Badge variant="outline" className="text-xs capitalize">{startup.my_role}</Badge>
                </div>
                <div className="flex gap-1">
                  {(startup.my_role === "owner" || startup.my_role === "admin") && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditStartup(startup)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewStartup?.(startup.id)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {canCreate && (
        <CreateStartupWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={refetch} />
      )}

      {editStartup && (
        <EditStartupDialog
          open={!!editStartup}
          onOpenChange={(open) => { if (!open) setEditStartup(null); }}
          startup={editStartup}
          onUpdated={() => { setEditStartup(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default MyStartupsPage;
