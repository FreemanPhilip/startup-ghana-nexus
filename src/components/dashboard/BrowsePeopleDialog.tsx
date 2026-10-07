import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { browseAudience } from "@/lib/browseAudience";
import type { RailRole } from "@/lib/dashboardRail";

interface PersonItem {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  industry: string | null;
  company_name: string | null;
  expertise: string[] | null;
  availability: string | null;
  years_experience: number | null;
}

interface BrowsePeopleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whose dashboard this is — decides who the list contains. */
  role?: RailRole;
  /** Open someone's public profile. */
  onSelectPerson?: (userId: string) => void;
}

/**
 * The people directory, scoped to whoever is looking.
 *
 * It was "Browse Mentors" for everyone, and approximated a mentor as anyone
 * with an availability window set — so a mentor who opened it was shown other
 * mentors. The audience now comes from the viewer's role, and the role itself
 * comes from public_profiles rather than being inferred from a side effect of
 * filling in a form.
 */
const BrowsePeopleDialog = ({ open, onOpenChange, role, onSelectPerson }: BrowsePeopleDialogProps) => {
  const { user } = useAuth();
  const audience = browseAudience(role);
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;

    const run = async () => {
      setLoading(true);
      let query = supabase
        .from("public_profiles")
        .select(
          "user_id, full_name, avatar_url, headline, industry, company_name, expertise, availability, years_experience",
        )
        .order("full_name");

      // overlaps, not eq: people hold more than one role, and someone who is
      // both a founder and a mentor must be findable as either.
      if (audience.roles.length > 0) query = query.overlaps("roles", audience.roles);
      if (audience.availableOnly) query = query.not("availability", "is", null);

      const { data } = await query;
      if (!active) return;
      // Never offer the viewer themselves.
      setPeople((data ?? []).filter((p) => p.user_id && p.user_id !== user?.id) as PersonItem[]);
      setLoading(false);
    };

    void run();
    return () => {
      active = false;
    };
    // audience is derived from role, so role is the real dependency.
  }, [open, role, user?.id, audience.roles, audience.availableOnly]);

  // Reset the search each time it opens, so a stale term does not make the
  // list look empty.
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filtered = people.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.industry?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.headline?.toLowerCase().includes(q) ||
      p.expertise?.some((e) => e.toLowerCase().includes(q))
    );
  });

  const getInitials = (name: string | null) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pb-3 pt-5 text-left">
          <DialogTitle className="page-title">{audience.title}</DialogTitle>
          <DialogDescription className="text-[13px]">{audience.subtitle}</DialogDescription>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={audience.searchPlaceholder}
              className="h-9 pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? audience.emptySearch : audience.empty}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((person) => (
                <button
                  key={person.user_id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => {
                    onSelectPerson?.(person.user_id);
                    onOpenChange(false);
                  }}
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={person.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(person.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{person.full_name || "Member"}</p>
                      {person.availability === "available_now" && (
                        <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[9px]">
                          Available
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.headline || person.company_name || person.industry || "SparkX member"}
                    </p>
                    {person.expertise && person.expertise.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {person.expertise.slice(0, 3).map((e) => (
                          <Badge key={e} variant="outline" className="h-4 px-1.5 text-[9px]">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {person.years_experience ? (
                    <p className="shrink-0 text-[10px] text-muted-foreground">
                      {person.years_experience}y exp.
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BrowsePeopleDialog;
