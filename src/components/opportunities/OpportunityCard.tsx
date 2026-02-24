import { Calendar, MapPin, DollarSign, ExternalLink, Clock, CheckCircle2, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isPast, differenceInDays } from "date-fns";

export interface OpportunityData {
  id: string;
  title: string;
  description: string;
  type: string;
  organization: string;
  amount: string | null;
  deadline: string | null;
  location: string | null;
  eligibility: string | null;
  tags: string[] | null;
  is_featured: boolean;
  application_url: string | null;
  created_at: string;
  has_applied?: boolean;
}

interface OpportunityCardProps {
  opportunity: OpportunityData;
  onApply: (id: string) => void;
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

const OpportunityCard = ({ opportunity, onApply }: OpportunityCardProps) => {
  const isExpired = opportunity.deadline ? isPast(new Date(opportunity.deadline)) : false;
  const daysLeft = opportunity.deadline ? differenceInDays(new Date(opportunity.deadline), new Date()) : null;

  return (
    <div className={`rounded-xl border bg-card p-5 transition-shadow hover:shadow-md ${opportunity.is_featured ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColors[opportunity.type] || typeColors.grant}`}>
              {typeLabels[opportunity.type] || opportunity.type}
            </span>
            {opportunity.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                ★ Featured
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-bold leading-tight">{opportunity.title}</h3>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{opportunity.organization}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {opportunity.description}
      </p>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        {opportunity.amount && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {opportunity.amount}
          </span>
        )}
        {opportunity.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {opportunity.location}
          </span>
        )}
        {opportunity.deadline && (
          <span className={`flex items-center gap-1 ${isExpired ? "text-destructive" : daysLeft !== null && daysLeft <= 7 ? "text-amber-600" : ""}`}>
            <Calendar className="h-3 w-3" />
            {isExpired ? "Expired" : `Deadline: ${format(new Date(opportunity.deadline), "MMM d, yyyy")}`}
            {!isExpired && daysLeft !== null && daysLeft <= 14 && (
              <span className="font-semibold">({daysLeft}d left)</span>
            )}
          </span>
        )}
      </div>

      {/* Tags */}
      {opportunity.tags && opportunity.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opportunity.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0.5">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Eligibility */}
      {opportunity.eligibility && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          <span className="font-semibold">Eligibility:</span> {opportunity.eligibility}
        </p>
      )}

      {/* Action */}
      <div className="mt-4 flex items-center gap-2">
        {opportunity.has_applied ? (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs font-semibold" disabled>
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Applied
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs font-semibold"
            disabled={isExpired}
            onClick={() => onApply(opportunity.id)}
          >
            {isExpired ? "Closed" : "Apply Now"}
          </Button>
        )}
        {opportunity.application_url && (
          <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
            <a href={opportunity.application_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;
