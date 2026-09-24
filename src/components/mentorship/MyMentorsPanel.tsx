import { Clock, GraduationCap, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyMentorships } from "@/hooks/useMentorship";

const initials = (name: string | null) =>
  (name ?? "M")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "M";

/**
 * A mentee's view of the cohorts they belong to and the requests they are
 * waiting on. Without this, a request disappears after sending with no way to
 * tell whether it was ever answered.
 */
const MyMentorsPanel = () => {
  const { active, pending, loading, isError, refetch, leave } = useMyMentorships();

  if (loading) {
    return (
      <Card className="p-4">
        <h2 className="font-semibold">My mentors</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 p-4">
        <h2 className="font-semibold">My mentors</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Couldn't load your mentorships. This isn't an empty list.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (active.length === 0 && pending.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-4 w-4 text-primary" />
          My mentors
        </h2>
        <Badge variant="outline">{active.length}</Badge>
      </div>

      <div className="space-y-2">
        {active.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={m.avatar_url ?? undefined} />
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {initials(m.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.full_name ?? "Mentor"}</p>
              <p className="truncate text-xs text-muted-foreground">{m.headline ?? "Mentor"}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => void leave(m.id)}
              title="Leave this cohort"
            >
              <LogOut className="h-3.5 w-3.5" /> Leave
            </Button>
          </div>
        ))}

        {pending.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-3"
          >
            <Avatar className="h-9 w-9 opacity-70">
              <AvatarImage src={m.avatar_url ?? undefined} />
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {initials(m.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.full_name ?? "Mentor"}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Awaiting their response
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => void leave(m.id)}
            >
              Withdraw
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MyMentorsPanel;
