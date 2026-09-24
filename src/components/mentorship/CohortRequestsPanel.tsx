import { Check, X, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CohortMember } from "@/lib/supabase/queries/mentorship";

interface CohortRequestsPanelProps {
  requests: CohortMember[];
  onRespond: (args: { id: string; accept: boolean }) => Promise<unknown>;
  busy?: boolean;
}

const initials = (name: string | null) =>
  (name ?? "M")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "M";

/** Pending requests from founders who asked to join this mentor's cohort. */
const CohortRequestsPanel = ({ requests, onRespond, busy }: CohortRequestsPanelProps) => {
  if (requests.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <UserPlus className="h-4 w-4 text-primary" />
          Requests to join
        </h2>
        <Badge variant="outline">{requests.length}</Badge>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-2xl border border-border bg-card p-3"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.avatar_url ?? undefined} />
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {initials(request.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{request.full_name ?? "Founder"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {request.headline ?? "Founder in progress"}
                </p>
                {request.note && (
                  <p className="mt-2 rounded-lg bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
                    {request.note}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Requested {new Date(request.requested_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                disabled={busy}
                onClick={() => void onRespond({ id: request.id, accept: true })}
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                disabled={busy}
                onClick={() => void onRespond({ id: request.id, accept: false })}
              >
                <X className="h-3.5 w-3.5" /> Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CohortRequestsPanel;
