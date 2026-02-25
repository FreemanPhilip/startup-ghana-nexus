import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, MapPin, DollarSign, Clock,
  Building2, Tag, CheckCircle2, AlertTriangle, Users, Globe,
  Bookmark, FileText, Briefcase, Target, Layers
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

const typeLabels: Record<string, string> = {
  grant: "Equity-Free Grant",
  funding_call: "Funding Call",
  accelerator: "Accelerator Program",
  job: "Job Opening",
};

const typeIcons: Record<string, typeof Briefcase> = {
  grant: DollarSign,
  funding_call: Target,
  accelerator: Layers,
  job: Briefcase,
};

const OpportunityDetailPage = ({ opportunityId, onBack }: OpportunityDetailPageProps) => {
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicantCount, setApplicantCount] = useState(0);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, [opportunityId, user]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
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
  const TypeIcon = typeIcons[opportunity.type] || DollarSign;

  const eligibilityItems = opportunity.eligibility
    ? opportunity.eligibility.split(/\n|(?:\.\s)/).filter((s: string) => s.trim().length > 5)
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
      {/* Back to Board */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Board
      </Button>

      {/* Hero Header Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            {/* Icon */}
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {opportunity.organization_logo ? (
                <img src={opportunity.organization_logo} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <TypeIcon className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-primary">{opportunity.organization}</span>
                {opportunity.is_featured && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
                {!isExpired && daysLeft !== null && daysLeft <= 14 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-[11px] font-bold uppercase">
                    <Clock className="h-3 w-3" />
                    {daysLeft} days left
                  </span>
                )}
                {isExpired && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-[11px] font-bold uppercase">
                    <AlertTriangle className="h-3 w-3" /> Closed
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold leading-tight text-foreground">{opportunity.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {opportunity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {opportunity.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Posted {format(new Date(opportunity.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg">
              <Bookmark className="h-4 w-4" />
            </Button>
            {hasApplied ? (
              <Button size="lg" variant="outline" disabled className="gap-2 font-semibold rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Applied
              </Button>
            ) : (
              <Button
                size="lg"
                className="gap-2 font-semibold rounded-lg px-8"
                disabled={isExpired}
                onClick={() => setShowApplicationForm(true)}
              >
                {isExpired ? "Closed" : "Apply Now"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Overview
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {opportunity.description}
            </p>
          </div>

          {/* Eligibility Criteria */}
          {opportunity.eligibility && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>📋</span>
                Eligibility Criteria
              </h2>
              <div className="space-y-3">
                {eligibilityItems.length > 0 ? (
                  eligibilityItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.trim()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.eligibility}</p>
                )}
              </div>
            </div>
          )}

          {/* Application Requirements */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-destructive">📌</span>
              Application Requirements
            </h2>
            <div className="space-y-3">
              {opportunity.type === "job" ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Upload your CV/Resume</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Cover letter explaining your interest</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Upload your Pitch Deck (or select from saved decks)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Brief motivation statement</p>
                  </div>
                </>
              )}
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Contact information (phone, email)</p>
              </div>
            </div>

            <div className="pt-2">
              {hasApplied ? (
                <Button size="lg" variant="outline" disabled className="gap-2 font-semibold w-full sm:w-auto">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Application Submitted
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="gap-2 font-semibold w-full sm:w-auto"
                  disabled={isExpired}
                  onClick={() => setShowApplicationForm(true)}
                >
                  {isExpired ? "Applications Closed" : "Apply Now"}
                </Button>
              )}
            </div>
          </div>

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Tag className="h-4 w-4" /> Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-3 py-1">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-1">
            <h3 className="text-base font-bold mb-4">
              {opportunity.type === "job" ? "Job Details" : opportunity.type === "accelerator" ? "Program Details" : "Grant Details"}
            </h3>
            {opportunity.amount && (
              <>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Funding Amount</span>
                  <span className="text-sm font-bold text-primary">{opportunity.amount}</span>
                </div>
                <Separator />
              </>
            )}
            {opportunity.deadline && (
              <>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Deadline</span>
                  <span className={`text-sm font-semibold ${isExpired ? "text-destructive" : ""}`}>
                    {isExpired ? "Closed" : format(new Date(opportunity.deadline), "MMM d, yyyy")}
                  </span>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-semibold">{typeLabels[opportunity.type] || opportunity.type}</span>
            </div>
            <Separator />
            {opportunity.location && (
              <>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-semibold">{opportunity.location}</span>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Applicants</span>
              <span className="text-sm font-semibold">{applicantCount}</span>
            </div>
          </div>

          {/* About the Provider */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold">About the Provider</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {opportunity.organization_logo ? (
                  <img src={opportunity.organization_logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{opportunity.organization}</p>
                <p className="text-xs text-muted-foreground">Organization</p>
              </div>
            </div>
            {opportunity.application_url && (
              <>
                <Separator />
                <Button variant="outline" className="w-full gap-1.5 text-sm" asChild>
                  <a href={opportunity.application_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                    View Profile
                  </a>
                </Button>
              </>
            )}
          </div>

          {/* Applicant Stats */}
          <div className="rounded-xl border border-border bg-primary p-6 text-primary-foreground space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-base font-bold">Application Stats</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{applicantCount}</span>
              <span className="text-sm opacity-80">applicant{applicantCount !== 1 ? "s" : ""} so far</span>
            </div>
            {!isExpired && daysLeft !== null && (
              <p className="text-sm opacity-80">
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining to apply
              </p>
            )}
          </div>
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
