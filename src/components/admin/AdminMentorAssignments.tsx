import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAdminCohort, useMentorAssignment } from "@/hooks/useMentorship";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface DirectoryUser {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  roles: AppRole[];
}

const initials = (name: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

/**
 * Admin tool for building a mentor's cohort: pick a mentor, select any number
 * of mentees, assign them in one action. Assigning is idempotent — someone
 * already in the cohort is reported as skipped rather than duplicated.
 */
const AdminMentorAssignments = () => {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [mentorId, setMentorId] = useState<string | null>(null);
  const [mentorSearch, setMentorSearch] = useState("");
  const [menteeSearch, setMenteeSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  const { cohort, loading: cohortLoading, refetch } = useAdminCohort(mentorId);
  const { assign, assigning, remove } = useMentorAssignment();

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.rpc("get_admin_profiles"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (roleResult.error) throw roleResult.error;

      const rolesByUser = new Map<string, AppRole[]>();
      (roleResult.data ?? []).forEach((row) => {
        const list = rolesByUser.get(row.user_id) ?? [];
        list.push(row.role);
        rolesByUser.set(row.user_id, list);
      });

      setUsers(
        (profileResult.data ?? []).map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          headline: p.headline,
          avatar_url: p.avatar_url,
          roles: rolesByUser.get(p.user_id) ?? [],
        })),
      );
    } catch (error) {
      console.error("Could not load the user directory:", error);
      setLoadError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const mentors = useMemo(() => {
    const term = mentorSearch.trim().toLowerCase();
    return users
      .filter((u) => u.roles.includes("mentor" as AppRole))
      .filter((u) => !term || (u.full_name ?? "").toLowerCase().includes(term));
  }, [users, mentorSearch]);

  const selectedMentor = useMemo(
    () => users.find((u) => u.user_id === mentorId) ?? null,
    [users, mentorId],
  );

  // Anyone already active in this cohort is not offered again.
  const activeMenteeIds = useMemo(
    () => new Set(cohort.filter((c) => c.status === "active").map((c) => c.mentee_id)),
    [cohort],
  );

  const assignableMentees = useMemo(() => {
    const term = menteeSearch.trim().toLowerCase();
    return users
      .filter((u) => u.user_id !== mentorId)
      .filter((u) => !activeMenteeIds.has(u.user_id))
      .filter((u) => !term || (u.full_name ?? "").toLowerCase().includes(term));
  }, [users, mentorId, activeMenteeIds, menteeSearch]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      assignableMentees.forEach((m) => next.add(m.user_id));
      return next;
    });
  };

  const handleAssign = async () => {
    if (!mentorId || selected.size === 0) return;
    await assign({ mentorId, menteeIds: Array.from(selected), note: note.trim() || undefined });
    setSelected(new Set());
    setNote("");
    refetch();
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading directory…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive/70" />
        <p className="font-medium">Couldn't load users</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong reaching the server. This isn't an empty directory.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadUsers()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Mentor assignments</h1>
        <p className="text-sm text-muted-foreground">
          Assign mentees to a mentor in bulk. Both sides are notified.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        {/* Step 1 — pick the mentor */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">1. Choose a mentor</h2>
            <Badge variant="outline">{mentors.length}</Badge>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={mentorSearch}
              onChange={(e) => setMentorSearch(e.target.value)}
              placeholder="Search mentors"
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-2">
              {mentors.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No users hold the mentor role yet. Assign one from the Users tab first.
                </p>
              ) : (
                mentors.map((mentor) => (
                  <button
                    key={mentor.user_id}
                    type="button"
                    onClick={() => {
                      setMentorId(mentor.user_id);
                      setSelected(new Set());
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      mentorId === mentor.user_id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={mentor.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-muted text-xs font-semibold">
                        {initials(mentor.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{mentor.full_name ?? "Unnamed"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {mentor.headline ?? "Mentor"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Step 2 — pick mentees and assign */}
        <div className="space-y-4">
          {!mentorId ? (
            <Card className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">Pick a mentor to begin</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You'll then choose the mentees to add to their cohort.
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">
                    2. Select mentees for {selectedMentor?.full_name ?? "this mentor"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selected.size} selected</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={selectAllVisible}
                      disabled={assignableMentees.length === 0}
                    >
                      Select all shown
                    </Button>
                    {selected.size > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setSelected(new Set())}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={menteeSearch}
                    onChange={(e) => setMenteeSearch(e.target.value)}
                    placeholder="Search people to add"
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[260px] pr-3">
                  <div className="space-y-2">
                    {assignableMentees.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Nobody left to add — everyone matching is already in this cohort.
                      </p>
                    ) : (
                      assignableMentees.map((mentee) => (
                        <label
                          key={mentee.user_id}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={selected.has(mentee.user_id)}
                            onCheckedChange={() => toggle(mentee.user_id)}
                          />
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={mentee.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-muted text-xs font-semibold">
                              {initials(mentee.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {mentee.full_name ?? "Unnamed"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {mentee.headline ?? "Member"}
                            </p>
                          </div>
                          {mentee.roles.length > 0 && (
                            <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                              {mentee.roles[0].replace(/_/g, " ")}
                            </Badge>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="assign-note">Note for both sides (optional)</Label>
                  <Textarea
                    id="assign-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Q4 fintech cohort"
                    className="min-h-[64px] text-sm"
                    maxLength={500}
                  />
                </div>

                <Button
                  className="mt-4 w-full gap-2"
                  disabled={selected.size === 0 || assigning}
                  onClick={() => void handleAssign()}
                >
                  <UserPlus className="h-4 w-4" />
                  {assigning
                    ? "Assigning…"
                    : `Assign ${selected.size || ""} mentee${selected.size === 1 ? "" : "s"}`.trim()}
                </Button>
              </Card>

              {/* Current cohort */}
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Current cohort</h2>
                  <Badge variant="outline">{activeMenteeIds.size}</Badge>
                </div>

                {cohortLoading ? (
                  <p className="text-sm text-muted-foreground">Loading cohort…</p>
                ) : cohort.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    This mentor has no mentees yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cohort.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {initials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {member.full_name ?? "Unnamed"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.status} · added via {member.source}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Remove from cohort"
                          onClick={async () => {
                            await remove({ id: member.id, mentorId });
                            refetch();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMentorAssignments;
