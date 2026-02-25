import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Video, Users, Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { GroupEvent } from "@/hooks/useGroupEvents";

interface GroupEventsTabProps {
  events: GroupEvent[];
  loading: boolean;
  isMember: boolean;
  isAdmin: boolean;
  onRsvp: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

const GroupEventsTab = ({ events, loading, isMember, isAdmin, onRsvp, onDelete }: GroupEventsTabProps) => {
  if (loading) return <div className="text-center py-12 text-sm text-muted-foreground">Loading events...</div>;

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now);
  const past = events.filter(e => new Date(e.event_date) < now);

  const renderEvent = (event: GroupEvent) => {
    const eventDate = new Date(event.event_date);
    const isGoing = event.my_rsvp === "going";

    return (
      <div key={event.id} className="rounded-xl border border-border bg-card p-4 flex gap-4">
        {/* Date block */}
        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 text-primary w-14 h-14 shrink-0">
          <span className="text-[10px] font-bold uppercase">{format(eventDate, "MMM")}</span>
          <span className="text-lg font-bold leading-none">{format(eventDate, "dd")}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">{event.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(eventDate, "h:mm a")} · {event.is_virtual ? "Virtual" : event.location || "TBD"}
              </p>
            </div>
            {isAdmin && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onDelete(event.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {event.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{event.description}</p>}

          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {event.is_virtual ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              <span>{event.is_virtual ? "Online" : event.location || "Location TBD"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{event.rsvp_count} going</span>
            </div>
          </div>

          {isMember && new Date(event.event_date) >= now && (
            <Button
              size="sm"
              variant={isGoing ? "secondary" : "default"}
              className="mt-3 gap-1.5 text-xs"
              onClick={() => onRsvp(event.id)}
            >
              {isGoing ? <><Check className="h-3 w-3" /> Going</> : "RSVP"}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {upcoming.length === 0 && past.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No events yet.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming Events</h3>
          <div className="space-y-3">{upcoming.map(renderEvent)}</div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Events</h3>
          <div className="space-y-3 opacity-60">{past.map(renderEvent)}</div>
        </div>
      )}
    </div>
  );
};

export default GroupEventsTab;
