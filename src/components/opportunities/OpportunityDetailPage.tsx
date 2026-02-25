import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, MapPin, DollarSign, ExternalLink, Clock,
  Building2, Tag, CheckCircle2, AlertTriangle, Users, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isPast, differenceInDays } from "date-fns";
import ApplicationFormDialog from "./ApplicationFormDialog";

interface OpportunityDetailPageProps {
  opportunityId: string;
  onBack: () => void;
}

const typeColors: Record<string, string> = {
  grant: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  funding_call: "bg-primary/10 text-primary border-primary/20",
  accelerator: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  job: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const typeLabels: Record<string, string> = {
  grant: "Grant",
  funding_call: "Funding Call",
  accelerator: "Accelerator",
  job: "Job",
};

const OpportunityDetailPage = ({ opportunityId, onBack }: OpportunityDetailPageProps) => {
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicantCount, setApplicantCount] = useState(0);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [oppRes, countRes] = await Promise.all([
        supabase.from("opportunities").select("*").eq("id", opportunityId).single(),
        supabase.from("opportunity_applications").select("id", { count: "exact", head: true }).eq("opportunity_id", opportunityId),
      ]);

      if (oppRes.data) setOpportunity(oppRes.data);
      setApplicantCount(countRes.count ?? 0);

      if (user) {
        const { data } = await supabase
          .from("opportunity_applications")
          .select("id")
          .eq("opportunity_id", opportunityId)
          .eq("user_id", user.id)
          .maybeSingle();
        setHasApplied(!!data);
      }
      setLoading(false);
    };
    fetch();
  }, [opportunityId, user]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Opportunity not found.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const isExpired = opportunity.deadline ? isPast(new Date(opportunity.deadline)) : false;
  const daysLeft = opportunity.deadline ? differenceInDays(new Date(opportunity.deadline), new Date()) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Opportunities
      </Button>

      {/* Header Card */}
      <div className={`rounded-xl border bg-card p-6 ${opportunity.is_featured ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${typeColors[opportunity.type] || typeColors.grant}`}>
                {typeLabels[opportunity.type] || opportunity.type}
              </span>
              {opportunity.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-1 text-[11px] font-bold text-primary-foreground">
                  ★ Featured
                </span>
              )}
              {isExpired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-[11px] font-bold">
                  <AlertTriangle className="h-3 w-3" /> Closed
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold leading-tight">{opportunity.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{opportunity.organization}</span>
            </div>
          </div>
          {opportunity.organization_logo && (
            <img src={opportunity.organization_logo} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
          )}
        </div>

        {/* Key Info Chips */}
        <div className="mt-5 flex flex-wrap gap-3">
          {opportunity.amount && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600">
              <DollarSign className="h-4 w-4" />
              {opportunity.amount}
            </div>
          )}
          {opportunity.location && (
            <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {opportunity.location}
            </div>
          )}
          {opportunity.deadline && (
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
              isExpired ? "bg-destructive/10 text-destructive" :
              daysLeft !== null && daysLeft <= 7 ? "bg-amber-500/10 text-amber-600" :
              "bg-muted text-muted-foreground"
            }`}>
              <Calendar className="h-4 w-4" />
              {isExpired ? "Deadline Passed" : format(new Date(opportunity.deadline), "MMM d, yyyy")}
              {!isExpired && daysLeft !== null && daysLeft <= 14 && (
                <span className="font-bold">({daysLeft}d left)</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="mt-6 flex items-center gap-3">
          {hasApplied ? (
            <Button size="lg" variant="outline" disabled className="gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Application Submitted
            </Button>
          ) : (
            <Button
              size="lg"
              className="gap-2 font-semibold px-8"
              disabled={isExpired}
              onClick={() => setShowApplicationForm(true)}
            >
              {isExpired ? "Applications Closed" : "Apply Now"}
            </Button>
          )}
          {opportunity.application_url && (
            <Button size="lg" variant="outline" className="gap-1.5" asChild>
              <a href={opportunity.application_url} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
                External Link
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-bold">About This Opportunity</h2>
        <Separator />
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {opportunity.description}
        </p>
      </div>

      {/* Eligibility Section */}
      {opportunity.eligibility && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold">Eligibility Requirements</h2>
          <Separator />
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {opportunity.eligibility}
          </p>
        </div>
      )}

      {/* Tags */}
      {opportunity.tags && opportunity.tags.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Tag className="h-4 w-4" /> Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {opportunity.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Posted {format(new Date(opportunity.created_at), "MMMM d, yyyy")}
        </div>
      </div>

      {/* Application Form Dialog */}
      <ApplicationFormDialog
        open={showApplicationForm}
        onOpenChange={setShowApplicationForm}
        opportunity={opportunity}
        onSuccess={() => {
          setHasApplied(true);
          setApplicantCount(c => c + 1);
        }}
      />
    </motion.div>
  );
};

export default OpportunityDetailPage;
