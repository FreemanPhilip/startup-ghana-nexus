import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Clock3, MessageSquareText, PencilLine, Plus, Trash2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCohort } from "@/hooks/useMentorship";
import CohortRequestsPanel from "./CohortRequestsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { buildMentorPipelineSummary } from "@/lib/dashboardMetrics";

interface MenteeTask {
  id: string;
  menteeId: string;
  title: string;
  notes: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Done";
}

interface MentoringMeeting {
  id: string;
  menteeId: string;
  title: string;
  date: string;
  time: string;
  agenda: string;
  summary: string;
}

interface MenteeProfile {
  userId: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
  lastMeeting: string | null;
  meetingsCount: number;
}

const taskStorageKey = (userId: string | undefined) => `sparkx-mentor-tasks-${userId ?? "guest"}`;
const meetingStorageKey = (userId: string | undefined) => `sparkx-mentor-meetings-${userId ?? "guest"}`;

const toTaskRecord = (row: Partial<MenteeTask> & { due_date?: string; priority?: string; status?: string }): MenteeTask => ({
  id: row.id ?? "",
  menteeId: row.menteeId ?? "",
  title: row.title ?? "",
  notes: row.notes ?? "",
  dueDate: row.dueDate ?? row.due_date ?? new Date().toISOString().slice(0, 10),
  priority: ((row.priority as MenteeTask["priority"]) ?? "Medium") as MenteeTask["priority"],
  status: ((row.status as MenteeTask["status"]) ?? "Open") as MenteeTask["status"],
});

const toMeetingRecord = (row: Partial<MentoringMeeting> & { meeting_date?: string; start_time?: string; mentor_id?: string; mentee_id?: string }): MentoringMeeting => ({
  id: row.id ?? "",
  menteeId: row.menteeId ?? row.mentee_id ?? "",
  title: row.title ?? "",
  date: row.date ?? row.meeting_date ?? new Date().toISOString().slice(0, 10),
  time: row.time ?? row.start_time ?? "09:00",
  agenda: row.agenda ?? "",
  summary: row.summary ?? "Meeting scheduled with mentor.",
});

export const buildMentorshipUpdateMessage = ({
  type,
  mentorName,
  title,
  date,
  time,
}: {
  type: "meeting" | "task";
  mentorName: string;
  title: string;
  date: string;
  time?: string;
}) => {
  if (type === "meeting") {
    return `${mentorName} scheduled a mentorship meeting: ${title} on ${new Date(date).toLocaleDateString()}${time ? ` at ${time}` : ""}.`;
  }

  return `${mentorName} assigned a task for you: ${title}. Please review the due date ${new Date(date).toLocaleDateString()}.`;
};

export const buildConversationFilter = (userId: string, otherUserId: string) =>
  `and(participant_one.eq.${userId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId})`;

const parseStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const MenteeCirclePage = () => {
  const { user } = useAuth();
  // Cohort membership is now explicit (mentor_mentees). Bookings still feed the
  // "last meeting" detail below, and are unioned in so a mentor whose project
  // has not yet run the migration still sees everyone they have met.
  const cohort = useCohort();
  const activeCohortKey = cohort.active.map((m) => m.mentee_id).sort().join(",");
  const activeCohortIds = useMemo(
    () => (activeCohortKey ? activeCohortKey.split(",") : []),
    [activeCohortKey],
  );
  const [mentees, setMentees] = useState<MenteeProfile[]>([]);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<MenteeTask[]>([]);
  const [meetings, setMeetings] = useState<MentoringMeeting[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [taskPriority, setTaskPriority] = useState<MenteeTask["priority"]>("Medium");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [meetingTime, setMeetingTime] = useState("09:00");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const cohortPanelRef = useRef<HTMLDivElement | null>(null);

  // Always give the CTA a visible effect: select the first mentee when there is
  // one, and bring the cohort/requests column into view either way. Previously
  // it silently did nothing whenever the cohort was empty — which is exactly
  // when the button reads "Review your cohort".
  const handleCohortCta = () => {
    setSelectedMenteeId((current) => current ?? mentees[0]?.userId ?? null);
    cohortPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: bookings, error: bookingsError } = await supabase
          .from("mentor_bookings")
          .select("mentee_id, booking_date, status")
          .eq("mentor_id", user.id)
          .order("booking_date", { ascending: false });

        if (bookingsError) throw bookingsError;

        const bookingIds = (bookings ?? []).map((b) => b.mentee_id).filter(Boolean) as string[];
        const cohortIds = activeCohortIds;
        const menteeIds = Array.from(new Set([...cohortIds, ...bookingIds]));

        if (menteeIds.length === 0) {
          setMentees([]);
          setSelectedMenteeId(null);
          setLoading(false);
          return;
        }

        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("user_id, full_name, avatar_url, headline")
          .in("user_id", menteeIds);

        const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

        const menteeList: MenteeProfile[] = menteeIds.map((menteeId) => {
          const entries = (bookings ?? []).filter((booking) => booking.mentee_id === menteeId);
          const profile = profileMap.get(menteeId);

          return {
            userId: menteeId,
            fullName: profile?.full_name ?? "Mentee",
            headline: profile?.headline ?? "Founder in progress",
            avatarUrl: profile?.avatar_url ?? null,
            lastMeeting: entries[0]?.booking_date ?? null,
            meetingsCount: entries.length,
          };
        });

        setMentees(menteeList);
        setSelectedMenteeId((current) => current ?? menteeList[0]?.userId ?? null);
      } catch (error) {
        console.error("Could not load mentee circle:", error);
        setMentees([]);
        setSelectedMenteeId(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, activeCohortIds]);

  useEffect(() => {
    const loadMentorshipData = async () => {
      if (!user) return;

      const fallbackTasks = parseStorage(taskStorageKey(user.id), [] as MenteeTask[]);
      const fallbackMeetings = parseStorage(meetingStorageKey(user.id), [] as MentoringMeeting[]);

      try {
        const [taskResult, meetingResult] = await Promise.all([
          supabase.from("mentor_tasks").select("*").eq("mentor_id", user.id).order("due_date", { ascending: true }),
          supabase.from("mentor_meetings").select("*").eq("mentor_id", user.id).order("meeting_date", { ascending: true }),
        ]);

        if (!taskResult.error && taskResult.data) {
          setTasks(taskResult.data.map((row) => toTaskRecord({
            ...row,
            menteeId: row.mentee_id,
            dueDate: row.due_date,
            priority: row.priority as MenteeTask["priority"],
            status: row.status as MenteeTask["status"],
          })));
        } else {
          setTasks(fallbackTasks);
        }

        if (!meetingResult.error && meetingResult.data) {
          setMeetings(meetingResult.data.map((row) => toMeetingRecord({
            ...row,
            menteeId: row.mentee_id,
            date: row.meeting_date,
            time: row.start_time,
          })));
        } else {
          setMeetings(fallbackMeetings);
        }
      } catch {
        setTasks(fallbackTasks);
        setMeetings(fallbackMeetings);
      }
    };

    void loadMentorshipData();
  }, [user]);

  const selectedMentee = useMemo(
    () => mentees.find((mentee) => mentee.userId === selectedMenteeId) ?? mentees[0] ?? null,
    [mentees, selectedMenteeId],
  );

  const selectedTasks = useMemo(
    () => tasks.filter((task) => task.menteeId === selectedMentee?.userId),
    [selectedMentee, tasks],
  );

  const selectedMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.menteeId === selectedMentee?.userId),
    [selectedMentee, meetings],
  );

  const openTaskCount = tasks.filter((task) => task.menteeId === selectedMentee?.userId && task.status !== "Done").length;
  const mentorSummary = buildMentorPipelineSummary({
    pendingCount: cohort.pending.length,
    menteeCount: mentees.length,
    meetingCount: meetings.length,
    openTaskCount: tasks.filter((task) => task.status !== "Done").length,
  });

  const saveTasks = (nextTasks: MenteeTask[]) => {
    setTasks(nextTasks);
    if (user) window.localStorage.setItem(taskStorageKey(user.id), JSON.stringify(nextTasks));
  };

  const saveMeetings = (nextMeetings: MentoringMeeting[]) => {
    setMeetings(nextMeetings);
    if (user) window.localStorage.setItem(meetingStorageKey(user.id), JSON.stringify(nextMeetings));
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskNotes("");
    setTaskDueDate(new Date().toISOString().slice(0, 10));
    setTaskPriority("Medium");
    setEditingTaskId(null);
  };

  const resetMeetingForm = () => {
    setMeetingTitle("");
    setMeetingAgenda("");
    setMeetingDate(new Date().toISOString().slice(0, 10));
    setMeetingTime("09:00");
    setEditingMeetingId(null);
  };

  const persistTask = async (task: MenteeTask) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("mentor_tasks").upsert({
        id: task.id,
        mentor_id: user.id,
        mentee_id: task.menteeId,
        title: task.title,
        notes: task.notes,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
      }, { onConflict: "id" });

      if (error) throw error;
    } catch {
      // Keep the local fallback behavior as a safe, non-blocking backup when the table is not yet available.
    }
  };

  const persistMeeting = async (meeting: MentoringMeeting) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("mentor_meetings").upsert({
        id: meeting.id,
        mentor_id: user.id,
        mentee_id: meeting.menteeId,
        title: meeting.title,
        meeting_date: meeting.date,
        start_time: meeting.time,
        agenda: meeting.agenda,
        summary: meeting.summary,
      }, { onConflict: "id" });

      if (error) throw error;
    } catch {
      // Keep the local fallback behavior as a safe, non-blocking backup when the table is not yet available.
    }
  };

  const sendMentorshipUpdate = async ({
    menteeId,
    title,
    body,
    type,
    date,
    time,
  }: {
    menteeId: string;
    title: string;
    body: string;
    type: "meeting" | "task";
    date: string;
    time?: string;
  }) => {
    if (!user) return;

    const { data: conversationMatches } = await supabase
      .from("conversations")
      .select("id, participant_one, participant_two")
      .or(buildConversationFilter(user.id, menteeId));

    const existing = conversationMatches?.find((conversation) =>
      (conversation.participant_one === user.id && conversation.participant_two === menteeId) ||
      (conversation.participant_one === menteeId && conversation.participant_two === user.id),
    );

    let conversationId = existing?.id;

    if (!conversationId) {
      const { data: createdConversation, error: createConversationError } = await supabase
        .from("conversations")
        .insert({
          participant_one: user.id,
          participant_two: menteeId,
        })
        .select("id")
        .single();

      if (createConversationError) {
        console.warn("Could not create mentorship conversation:", createConversationError);
        return;
      }

      conversationId = createdConversation?.id ?? null;
    }

    if (!conversationId) return;

    const message = buildMentorshipUpdateMessage({
      type,
      mentorName: user.user_metadata?.full_name || "Your mentor",
      title,
      date,
      time,
    });

    await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `${body}\n\n${message}`,
      });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    await supabase.from("notifications").insert({
      user_id: menteeId,
      actor_id: user.id,
      title,
      body,
      type,
      reference_id: conversationId,
    });
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMentee || !taskTitle.trim()) return;

    const newTask: MenteeTask = {
      id: `${selectedMentee.userId}-${Date.now()}`,
      menteeId: selectedMentee.userId,
      title: taskTitle.trim(),
      notes: taskNotes.trim(),
      dueDate: taskDueDate,
      priority: taskPriority,
      status: "Open",
    };

    const nextTasks = [...tasks, newTask];
    saveTasks(nextTasks);
    await persistTask(newTask);
    resetTaskForm();

    await sendMentorshipUpdate({
      menteeId: selectedMentee.userId,
      title: "Mentorship task assigned",
      body: `A new task has been assigned by ${user?.user_metadata?.full_name || "your mentor"}.`,
      type: "task",
      date: taskDueDate,
      time: undefined,
    });
  };

  const startTaskEdit = (task: MenteeTask) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskNotes(task.notes);
    setTaskDueDate(task.dueDate);
    setTaskPriority(task.priority);
  };

  const handleUpdateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMentee || !editingTaskId || !taskTitle.trim()) return;

    const updatedTask: MenteeTask = {
      ...tasks.find((task) => task.id === editingTaskId)!,
      title: taskTitle.trim(),
      notes: taskNotes.trim(),
      dueDate: taskDueDate,
      priority: taskPriority,
      menteeId: selectedMentee.userId,
    };

    const nextTasks = tasks.map((task) => (task.id === editingTaskId ? updatedTask : task));
    saveTasks(nextTasks);

    try {
      await supabase.from("mentor_tasks").update({
        title: updatedTask.title,
        notes: updatedTask.notes,
        due_date: updatedTask.dueDate,
        priority: updatedTask.priority,
      }).eq("id", editingTaskId);
    } catch {
      // Intentionally ignore table-availability issues and keep local fallback state.
    }

    resetTaskForm();
  };

  const handleCreateMeeting = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMentee || !meetingTitle.trim()) return;

    const newMeeting: MentoringMeeting = {
      id: `${selectedMentee.userId}-meeting-${Date.now()}`,
      menteeId: selectedMentee.userId,
      title: meetingTitle.trim(),
      date: meetingDate,
      time: meetingTime,
      agenda: meetingAgenda.trim(),
      summary: "Meeting scheduled with mentor.",
    };

    const nextMeetings = [...meetings, newMeeting];
    saveMeetings(nextMeetings);
    await persistMeeting(newMeeting);
    resetMeetingForm();

    await sendMentorshipUpdate({
      menteeId: selectedMentee.userId,
      title: "Mentorship meeting scheduled",
      body: `Your mentor has scheduled a meeting for ${new Date(meetingDate).toLocaleDateString()}.`,
      type: "meeting",
      date: meetingDate,
      time: meetingTime,
    });
  };

  const startMeetingEdit = (meeting: MentoringMeeting) => {
    setEditingMeetingId(meeting.id);
    setMeetingTitle(meeting.title);
    setMeetingDate(meeting.date);
    setMeetingTime(meeting.time);
    setMeetingAgenda(meeting.agenda);
  };

  const handleUpdateMeeting = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMentee || !editingMeetingId || !meetingTitle.trim()) return;

    const updatedMeeting: MentoringMeeting = {
      ...meetings.find((meeting) => meeting.id === editingMeetingId)!,
      title: meetingTitle.trim(),
      date: meetingDate,
      time: meetingTime,
      agenda: meetingAgenda.trim(),
      menteeId: selectedMentee.userId,
    };

    const nextMeetings = meetings.map((meeting) => (meeting.id === editingMeetingId ? updatedMeeting : meeting));
    saveMeetings(nextMeetings);

    try {
      await supabase.from("mentor_meetings").update({
        title: updatedMeeting.title,
        meeting_date: updatedMeeting.date,
        start_time: updatedMeeting.time,
        agenda: updatedMeeting.agenda,
      }).eq("id", editingMeetingId);
    } catch {
      // Intentionally ignore table-availability issues and keep local fallback state.
    }

    resetMeetingForm();
  };

  const toggleTaskStatus = async (taskId: string) => {
    const nextTasks = tasks.map((task): MenteeTask => {
      if (task.id !== taskId) return task;

      const nextStatus: MenteeTask["status"] = task.status === "Done" ? "Open" : "Done";
      return { ...task, status: nextStatus };
    });

    saveTasks(nextTasks);
    const taskToUpdate = nextTasks.find((task) => task.id === taskId);
    if (taskToUpdate) {
      try {
        await supabase.from("mentor_tasks").update({ status: taskToUpdate.status }).eq("id", taskId);
      } catch {
        // Intentionally ignore table-availability issues and keep local fallback state.
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    const nextTasks = tasks.filter((task) => task.id !== taskId);
    saveTasks(nextTasks);

    try {
      await supabase.from("mentor_tasks").delete().eq("id", taskId);
    } catch {
      // Intentionally ignore table-availability issues and keep local fallback state.
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    const nextMeetings = meetings.filter((meeting) => meeting.id !== meetingId);
    saveMeetings(nextMeetings);

    try {
      await supabase.from("mentor_meetings").delete().eq("id", meetingId);
    } catch {
      // Intentionally ignore table-availability issues and keep local fallback state.
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Mentorship</p>
          <h1 className="mt-1 page-title">Mentee Circle</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {mentees.length} connected mentees
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mentorship snapshot</p>
            <h2 className="mt-1 page-title">{mentorSummary.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{mentorSummary.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              {mentorSummary.engagementScore}% engagement
            </div>
            <Button size="sm" className="bg-gradient-brand text-white hover:opacity-90" onClick={handleCohortCta}>
              {mentorSummary.actionLabel}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active mentees</p>
          <p className="mt-3 text-3xl font-semibold">{mentees.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This month</p>
          <p className="mt-3 text-3xl font-semibold">{meetings.filter((meeting) => meeting.date >= new Date().toISOString().slice(0, 10)).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Open tasks</p>
          <p className="mt-3 text-3xl font-semibold">{openTaskCount}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div ref={cohortPanelRef} className="space-y-4 scroll-mt-24">
          <CohortRequestsPanel
            requests={cohort.pending}
            onRespond={cohort.respond}
            busy={cohort.responding}
          />

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Your cohort</h2>
              <Badge variant="outline">{mentees.length}</Badge>
            </div>

            <div className="space-y-3">
              {mentees.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No mentees yet. Founders appear here when they ask to join your cohort and you
                  accept, when they book a session with you, or when an admin assigns them.
                </div>
              ) : (
                mentees.map((mentee) => (
                  <button
                    key={mentee.userId}
                    type="button"
                    onClick={() => setSelectedMenteeId(mentee.userId)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selectedMentee?.userId === mentee.userId ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mentee.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-muted text-xs font-semibold">
                        {mentee.fullName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{mentee.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{mentee.headline}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {mentee.lastMeeting ? `Last meeting: ${new Date(mentee.lastMeeting).toLocaleDateString()}` : "No meetings yet"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {selectedMentee && (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedMentee.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-muted text-sm font-semibold">
                      {selectedMentee.fullName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="page-title">{selectedMentee.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{selectedMentee.headline}</p>
                  </div>
                </div>
                <Badge className="rounded-full border-primary/30 bg-primary/10 text-primary">
                  {selectedMentee.meetingsCount} sessions
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={editingMeetingId ? handleUpdateMeeting : handleCreateMeeting} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Schedule a meeting</h3>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Meeting title</label>
                    <input
                      value={meetingTitle}
                      onChange={(event) => setMeetingTitle(event.target.value)}
                      placeholder="Weekly founder check-in"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Date</label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(event) => setMeetingDate(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Time</label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(event) => setMeetingTime(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Agenda</label>
                    <textarea
                      value={meetingAgenda}
                      onChange={(event) => setMeetingAgenda(event.target.value)}
                      rows={3}
                      placeholder="Discuss traction, goals, risks, and next actions."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 gap-2">
                      <Plus className="h-4 w-4" /> {editingMeetingId ? "Save meeting" : "Add meeting"}
                    </Button>
                    {editingMeetingId && (
                      <Button type="button" variant="outline" onClick={resetMeetingForm} className="gap-2">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>

                <form onSubmit={editingTaskId ? handleUpdateTask : handleCreateTask} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Assign a task</h3>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Task title</label>
                    <input
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="Prepare customer interview list"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Due date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(event) => setTaskDueDate(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(event) => setTaskPriority(event.target.value as MenteeTask["priority"])}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Task notes</label>
                    <textarea
                      value={taskNotes}
                      onChange={(event) => setTaskNotes(event.target.value)}
                      rows={3}
                      placeholder="Ask the founder to capture 10 customer pain points and share them in the next session."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="secondary" className="flex-1 gap-2">
                      <Plus className="h-4 w-4" /> {editingTaskId ? "Save task" : "Assign task"}
                    </Button>
                    {editingTaskId && (
                      <Button type="button" variant="outline" onClick={resetTaskForm} className="gap-2">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Meetings</h3>
                </div>

                <div className="space-y-3">
                  {selectedMeetings.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No meetings scheduled yet for this mentee.
                    </div>
                  ) : (
                    selectedMeetings.map((meeting) => (
                      <div key={meeting.id} className="rounded-2xl border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">{meeting.agenda || "No agenda added yet"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => startMeetingEdit(meeting)} className="text-muted-foreground transition-colors hover:text-primary">
                              <PencilLine className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => deleteMeeting(meeting.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <CalendarDays className="h-3 w-3" /> {new Date(`${meeting.date}T${meeting.time}`).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <Clock3 className="h-3 w-3" /> {meeting.time}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Task board</h3>
                </div>

                <div className="space-y-3">
                  {selectedTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No tasks assigned yet. Create the first one on the left.
                    </div>
                  ) : (
                    selectedTasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.notes && <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => startTaskEdit(task)} className="text-muted-foreground transition-colors hover:text-primary">
                              <PencilLine className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => deleteTask(task.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>
                            {task.priority}
                          </Badge>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <Clock3 className="h-3 w-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                              task.status === "Done" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                            }`}
                          >
                            {task.status === "Done" ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                            {task.status}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenteeCirclePage;
