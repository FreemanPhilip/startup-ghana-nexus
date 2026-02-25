import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CreateEventDialogProps {
  onCreate: (data: { title: string; description: string; event_date: string; location: string; is_virtual: boolean }) => Promise<void>;
}

const CreateEventDialog = ({ onCreate }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !date) return;
    setCreating(true);
    const [hours, minutes] = time.split(":").map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);

    await onCreate({
      title: title.trim(),
      description: description.trim(),
      event_date: eventDate.toISOString(),
      location: location.trim(),
      is_virtual: isVirtual,
    });
    setOpen(false);
    setTitle(""); setDescription(""); setDate(undefined); setTime("10:00"); setLocation(""); setIsVirtual(false);
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Title</Label>
            <Input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea placeholder="What's this event about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={500} className="resize-none" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !date && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-28">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input placeholder={isVirtual ? "Meeting link (optional)" : "Venue address"} value={location} onChange={e => setLocation(e.target.value)} maxLength={200} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isVirtual} onCheckedChange={setIsVirtual} id="virtual" />
            <Label htmlFor="virtual" className="text-xs">Virtual event</Label>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={!title.trim() || !date || creating}>
            {creating ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
