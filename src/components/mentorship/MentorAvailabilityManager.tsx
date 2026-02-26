import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DAY_NAMES, DURATION_OPTIONS } from "./calendarUtils";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_duration: number;
  is_active: boolean;
  session_price: number;
  currency: string;
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // 7 AM to 20:30 PM
  const min = i % 2 === 0 ? "00" : "30";
  const h = hour.toString().padStart(2, "0");
  return { value: `${h}:${min}:00`, label: `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? "PM" : "AM"}` };
});

const MentorAvailabilityManager = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New slot form
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00:00");
  const [newEnd, setNewEnd] = useState("10:00:00");
  const [newDuration, setNewDuration] = useState("30");
  const [newPrice, setNewPrice] = useState("0");

  useEffect(() => {
    if (!user) return;
    fetchSlots();
  }, [user]);

  const fetchSlots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", user!.id)
      .order("day_of_week")
      .order("start_time");
    setSlots((data as any[]) ?? []);
    setLoading(false);
  };

  const addSlot = async () => {
    if (!user) return;
    if (newStart >= newEnd) {
      toast({ title: "Invalid time range", description: "End time must be after start time", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("mentor_availability").insert({
      mentor_id: user.id,
      day_of_week: parseInt(newDay),
      start_time: newStart,
      end_time: newEnd,
      session_duration: parseInt(newDuration),
      session_price: parseFloat(newPrice) || 0,
      currency: "USD",
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slot added!" });
      fetchSlots();
    }
    setSaving(false);
  };

  const toggleSlot = async (slot: AvailabilitySlot) => {
    await supabase
      .from("mentor_availability")
      .update({ is_active: !slot.is_active } as any)
      .eq("id", slot.id);
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, is_active: !s.is_active } : s));
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("mentor_availability").delete().eq("id", id);
    setSlots(prev => prev.filter(s => s.id !== id));
    toast({ title: "Slot removed" });
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Add Availability Slot
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Day</Label>
            <Select value={newDay} onValueChange={setNewDay}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((d, i) => (
                  <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start</Label>
            <Select value={newStart} onValueChange={setNewStart}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End</Label>
            <Select value={newEnd} onValueChange={setNewEnd}>
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
            <Select value={newDuration} onValueChange={setNewDuration}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(d => (
                  <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" /> Price (USD)</Label>
            <Input
              type="number"
              min="0"
              step="5"
              placeholder="0 = Free"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground">Set to 0 for free sessions</p>
          </div>
        </div>
        <Button size="sm" className="mt-3 gap-1.5 text-xs" onClick={addSlot} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add Slot
        </Button>
      </div>

      {/* Existing slots grouped by day */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-sm mb-4">Your Availability</h3>
        {slots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No availability slots set. Add your first slot above.</p>
        ) : (
          <div className="space-y-3">
            {DAY_NAMES.map((day, dayIndex) => {
              const daySlots = slots.filter(s => s.day_of_week === dayIndex);
              if (daySlots.length === 0) return null;
              return (
                <div key={dayIndex}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{day}</p>
                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div key={slot.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-3">
                          <Switch checked={slot.is_active} onCheckedChange={() => toggleSlot(slot)} />
                          <span className={`text-sm font-medium ${!slot.is_active ? "text-muted-foreground line-through" : ""}`}>
                            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{slot.session_duration} min</Badge>
                          <Badge className={`text-[10px] border-0 ${slot.session_price > 0 ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                            {slot.session_price > 0 ? `$${slot.session_price}` : "Free"}
                          </Badge>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSlot(slot.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorAvailabilityManager;
