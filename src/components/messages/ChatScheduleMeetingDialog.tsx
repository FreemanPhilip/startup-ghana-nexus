import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Loader2, Video, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatScheduleMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  otherUserName: string;
  otherUserId: string;
  onSendMessage: (content: string) => void;
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? "00" : "30";
  const label = `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? "PM" : "AM"}`;
  return { value: `${hour.toString().padStart(2, "0")}:${min}`, label };
});

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
];

const ChatScheduleMeetingDialog = ({ open, onClose, otherUserName, otherUserId, onSendMessage }: ChatScheduleMeetingDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("30");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSend = () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, "EEEE, MMMM d, yyyy");
    const timeLabel = TIME_OPTIONS.find(t => t.value === time)?.label || time;
    const durLabel = DURATION_OPTIONS.find(d => d.value === duration)?.label || `${duration} min`;

    const meetingMsg = [
      `📅 **Meeting Invitation**`,
      ``,
      `Hey ${otherUserName.split(" ")[0]}! I'd like to schedule a meeting:`,
      ``,
      `🗓 Date: ${dateStr}`,
      `🕐 Time: ${timeLabel}`,
      `⏱ Duration: ${durLabel}`,
      location ? `📍 Location: ${location}` : null,
      notes ? `📝 Notes: ${notes}` : null,
      ``,
      `Let me know if this works for you!`,
    ].filter(Boolean).join("\n");

    onSendMessage(meetingMsg);
    onClose();
    setSelectedDate(undefined);
    setTime("10:00");
    setDuration("30");
    setLocation("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Schedule a Meeting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Send a meeting invitation to {otherUserName}
          </p>

          {/* Date picker */}
          <div>
            <Label className="text-xs mb-1.5 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Date
            </Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                fromDate={new Date()}
                toDate={addDays(new Date(), 90)}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Location / Link (optional)
            </Label>
            <Input
              placeholder="e.g. Google Meet link, office address..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              placeholder="What would you like to discuss?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          <Button
            className="w-full text-sm font-semibold gap-1.5"
            onClick={handleSend}
            disabled={!selectedDate}
          >
            <CalendarIcon className="h-4 w-4" /> Send Meeting Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatScheduleMeetingDialog;
