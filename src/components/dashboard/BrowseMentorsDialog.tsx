import { useState, useEffect } from "react";
import { Search, Star, Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface MentorItem {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  industry: string | null;
  expertise: string[] | null;
  availability: string | null;
  years_experience: number | null;
}

interface BrowseMentorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMentor?: (mentorId: string) => void;
}

const BrowseMentorsDialog = ({ open, onOpenChange, onSelectMentor }: BrowseMentorsDialogProps) => {
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headline, industry, expertise, availability, years_experience")
        .not("availability", "is", null)
        .order("full_name");
      setMentors(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [open]);

  const filtered = mentors.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.industry?.toLowerCase().includes(q) ||
      m.expertise?.some(e => e.toLowerCase().includes(q))
    );
  });

  const getInitials = (name: string | null) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "M";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-lg">Browse Mentors</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, industry, or expertise..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {search ? "No mentors found matching your search" : "No mentors available yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(mentor => (
                <div
                  key={mentor.user_id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    onSelectMentor?.(mentor.user_id);
                    onOpenChange(false);
                  }}
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={mentor.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(mentor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{mentor.full_name || "Mentor"}</p>
                      {mentor.availability === "available_now" && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
                          Available
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {mentor.headline || `${mentor.industry || "Startup"} Expert`}
                    </p>
                    {mentor.expertise && mentor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mentor.expertise.slice(0, 3).map(e => (
                          <Badge key={e} variant="outline" className="text-[9px] h-4 px-1.5">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {mentor.years_experience && (
                      <p className="text-[10px] text-muted-foreground">
                        {mentor.years_experience}y exp.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BrowseMentorsDialog;
