import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfDay, setHours, setMinutes, isBefore } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2, Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadICSFile, getGoogleCalendarUrl, DAY_NAMES, type CalendarEvent } from "./calendarUtils";
import type { MentorData } from "./MentorCard";

interface BookSessionDialogProps {
  open: boolean;
  onClose: () => void;
  mentor: MentorData;
}

interface AvailSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_duration: number;
  session_price: number;
  currency: string;
}

interface TimeSlot {
  start: string;
  end: string;
  duration: number;
  price: number;
  currency: string;
}

const BookSessionDialog = ({ open, onClose, mentor }: BookSessionDialogProps) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ booking_date: string; start_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setNotes("");
    setBooked(null);
    fetchData();
  }, [open, mentor.id]);

  const fetchData = async () => {
    setLoading(true);
    const [availRes, bookingsRes] = await Promise.all([
      supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_id", mentor.id)
        .eq("is_active", true),
      supabase
        .from("mentor_bookings")
        .select("booking_date, start_time")
        .eq("mentor_id", mentor.id)
        .eq("status", "confirmed"),
    ]);
    setAvailability((availRes.data as any[]) ?? []);
    setExistingBookings((bookingsRes.data as any[]) ?? []);
    setLoading(false);
  };

  // Which days of the week have availability
  const availableDays = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);

  // Disable dates that don't have availability or are in the past
  const disableDate = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
    return !availableDays.has(date.getDay());
  };

  // Generate time slots for selected date
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const bookedTimes = new Set(
      existingBookings.filter(b => b.booking_date === dateStr).map(b => b.start_time)
    );

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

        // Skip past times for today
        if (format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
          const now = new Date();
          const slotTime = setMinutes(setHours(selectedDate, parseInt(startH)), parseInt(startM));
          if (isBefore(slotTime, now)) continue;
        }

        slots.push({
          start: `${startH}:${startM}`,
          end: `${endH}:${endM}`,
          duration: dur,
          price: (avail as any).session_price || 0,
          currency: (avail as any).currency || "USD",
        });
      }
    }
    return slots;
  }, [selectedDate, availability, existingBookings]);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const handleBook = async () => {
    if (!user || !selectedDate || !selectedSlot) return;
    setBooking(true);

    const bookingDate = format(selectedDate, "yyyy-MM-dd");
    const startTime = `${selectedSlot.start}:00`;
    const endTime = `${selectedSlot.end}:00`;

    // If paid session, redirect to Stripe checkout first
    if (selectedSlot.price > 0) {
      try {
        const { data, error } = await supabase.functions.invoke("create-mentor-payment", {
          body: {
            mentor_id: mentor.id,
            mentor_name: mentor.full_name,
            amount: selectedSlot.price,
            currency: selectedSlot.currency,
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            notes: notes.trim(),
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
          toast({ title: "Redirecting to payment...", description: "Complete payment to confirm your booking." });
          onClose();
        }
      } catch (err: any) {
        toast({ title: "Payment error", description: err.message, variant: "destructive" });
      }
      setBooking(false);
      return;
    }

    // Free session — book directly
    const { error } = await supabase.from("mentor_bookings").insert({
      mentor_id: mentor.id,
      mentee_id: user.id,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      notes: notes.trim() || null,
    } as any);

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      const [sh, sm] = selectedSlot.start.split(":").map(Number);
      const [eh, em] = selectedSlot.end.split(":").map(Number);
      const startDateObj = setMinutes(setHours(selectedDate, sh), sm);
      const endDateObj = setMinutes(setHours(selectedDate, eh), em);
      const event: CalendarEvent = {
        title: `Mentorship: ${mentor.full_name}`,
        description: `Mentorship session with ${mentor.full_name}.\n${notes ? `Notes: ${notes}` : ""}`,
        startDate: startDateObj,
        endDate: endDateObj,
      };
      setBooked(event);
      toast({ title: "Session booked!", description: `${format(selectedDate, "EEEE, MMMM d")} at ${formatTime(selectedSlot.start)}` });
    }
    setBooking(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {booked ? "Session Booked! 🎉" : `Book a Session with ${mentor.full_name?.split(" ")[0]}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : booked ? (
          /* Success state with calendar actions */
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Your session is confirmed. Add it to your calendar:
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="gap-2 text-sm"
                onClick={() => window.open(getGoogleCalendarUrl(booked), "_blank")}
              >
                <ExternalLink className="h-4 w-4" /> Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-sm"
                onClick={() => downloadICSFile(booked)}
              >
                <Download className="h-4 w-4" /> Download .ics File
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : availability.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">This mentor hasn't set up their availability yet.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Step 1: Pick a date */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" /> Select a Date
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
              {selectedDate && (
                <p className="text-xs text-center text-muted-foreground mt-1">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              )}
            </div>

            {/* Step 2: Pick a time */}
            {selectedDate && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Select a Time
                </p>
                {timeSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No available slots on this day. Try another date.
                  </p>
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
                        <span className={`block text-[10px] font-semibold ${slot.price > 0 ? "text-primary" : "text-secondary"}`}>
                          {slot.price > 0 ? `$${slot.price}` : "Free"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Notes + confirm */}
            {selectedSlot && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Notes (optional)</p>
                  <Textarea
                    placeholder="What would you like to discuss?"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{format(selectedDate!, "EEEE, MMMM d")}</span>
                    {" · "}
                    {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
                    {" · "}
                    <Badge variant="outline" className="text-[10px]">{selectedSlot.duration} min</Badge>
                  </p>
                </div>
                <Button className="w-full text-sm font-semibold gap-1.5" onClick={handleBook} disabled={booking}>
                  {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
                  {selectedSlot?.price > 0 ? `Pay $${selectedSlot.price} & Book` : "Confirm Booking"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookSessionDialog;
