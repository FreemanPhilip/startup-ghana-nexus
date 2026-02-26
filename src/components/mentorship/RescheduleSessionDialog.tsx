import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfDay, setHours, setMinutes, isBefore } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RescheduleSessionDialogProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  mentorId: string;
  mentorName: string;
  onRescheduled: () => void;
}

interface AvailSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_duration: number;
}

interface TimeSlot {
  start: string;
  end: string;
  duration: number;
}

const RescheduleSessionDialog = ({ open, onClose, bookingId, mentorId, mentorName, onRescheduled }: RescheduleSessionDialogProps) => {
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ booking_date: string; start_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedDate(undefined);
    setSelectedSlot(null);
    fetchData();
  }, [open, mentorId]);

  const fetchData = async () => {
    setLoading(true);
    const [availRes, bookingsRes] = await Promise.all([
      supabase.from("mentor_availability").select("*").eq("mentor_id", mentorId).eq("is_active", true),
      supabase.from("mentor_bookings").select("booking_date, start_time").eq("mentor_id", mentorId).eq("status", "confirmed"),
    ]);
    setAvailability((availRes.data as any[]) ?? []);
    setExistingBookings((bookingsRes.data as any[]) ?? []);
    setLoading(false);
  };

  const availableDays = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);

  const disableDate = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
    return !availableDays.has(date.getDay());
  };

  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const bookedTimes = new Set(existingBookings.filter(b => b.booking_date === dateStr).map(b => b.start_time));
    const slots: TimeSlot[] = [];
    for (const avail of dayAvail) {
      const [sh, sm] = avail.start_time.split(":").map(Number);
      const [eh, em] = avail.end_time.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      const dur = avail.session_duration;
      for (let m = startMins; m + dur <= endMins; m += dur) {
        const startH = Math.floor(m / 60).toString().padStart(2, "0");
        const startM = (m % 60).toString().padStart(2, "0");
        const endH = Math.floor((m + dur) / 60).toString().padStart(2, "0");
        const endM = ((m + dur) % 60).toString().padStart(2, "0");
        const startKey = `${startH}:${startM}:00`;
        if (bookedTimes.has(startKey)) continue;
        if (format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
          const now = new Date();
          const slotTime = setMinutes(setHours(selectedDate, parseInt(startH)), parseInt(startM));
          if (isBefore(slotTime, now)) continue;
        }
        slots.push({ start: `${startH}:${startM}`, end: `${endH}:${endM}`, duration: dur });
      }
    }
    return slots;
  }, [selectedDate, availability, existingBookings]);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    const { error } = await supabase
      .from("mentor_bookings")
      .update({
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: `${selectedSlot.start}:00`,
        end_time: `${selectedSlot.end}:00`,
        status: "confirmed",
      } as any)
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Reschedule failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Session rescheduled!", description: `${format(selectedDate, "EEEE, MMMM d")} at ${formatTime(selectedSlot.start)}` });
      onRescheduled();
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Reschedule Session with {mentorName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : availability.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No availability set.</p>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" /> Select New Date
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  disabled={disableDate}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Select New Time
                </p>
                {timeSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No slots available.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          selectedSlot?.start === slot.start
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        {formatTime(slot.start)}
                        <span className="block text-[10px] text-muted-foreground">{slot.duration} min</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{format(selectedDate!, "EEEE, MMMM d")}</span>
                    {" · "}
                    {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
                    {" · "}
                    <Badge variant="outline" className="text-[10px]">{selectedSlot.duration} min</Badge>
                  </p>
                </div>
                <Button className="w-full text-sm font-semibold gap-1.5" onClick={handleReschedule} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
                  Confirm Reschedule
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleSessionDialog;
