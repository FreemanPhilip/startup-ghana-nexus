import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "@/hooks/use-toast";
import {
  fetchCohort,
  fetchMyMentorships,
  fetchMentorshipWith,
  requestMentorship,
  respondToRequest,
  endMentorship,
  assignMenteesToMentor,
  removePairing,
  type CohortMember,
} from "@/lib/supabase/queries/mentorship";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/** Mentor side: the people in, or asking to join, your cohort. */
export function useCohort() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["cohort", user?.id];

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: () => fetchCohort(user!.id),
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cohort", user?.id] });

  // A founder asking to join should show up for the mentor immediately.
  useRealtimeSubscription(
    { table: "mentor_mentees", filter: user ? `mentor_id=eq.${user.id}` : undefined },
    invalidate,
    !!user,
  );

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => respondToRequest(id, accept),
    onSuccess: (_result, { accept }) => {
      toast({ title: accept ? "Mentee added to your cohort" : "Request declined" });
      invalidate();
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not update the request."), variant: "destructive" });
    },
  });

  const end = useMutation({
    mutationFn: (id: string) => endMentorship(id),
    onSuccess: () => {
      toast({ title: "Mentorship ended" });
      invalidate();
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not end the mentorship."), variant: "destructive" });
    },
  });

  const pending: CohortMember[] = data.filter((m) => m.status === "pending");
  const active: CohortMember[] = data.filter((m) => m.status === "active");

  return {
    all: data,
    pending,
    active,
    loading: isLoading,
    isError,
    refetch,
    respond: respond.mutateAsync,
    endMentorship: end.mutateAsync,
    responding: respond.isPending,
  };
}

/** Mentee side: the cohorts you belong to or have applied to. */
export function useMyMentorships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["myMentorships", user?.id],
    queryFn: () => fetchMyMentorships(user!.id),
    enabled: !!user,
  });

  useRealtimeSubscription(
    { table: "mentor_mentees", filter: user ? `mentee_id=eq.${user.id}` : undefined },
    () => queryClient.invalidateQueries({ queryKey: ["myMentorships", user?.id] }),
    !!user,
  );

  const leave = useMutation({
    mutationFn: (id: string) => endMentorship(id),
    onSuccess: () => {
      toast({ title: "You left the cohort" });
      queryClient.invalidateQueries({ queryKey: ["myMentorships", user?.id] });
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not leave the cohort."), variant: "destructive" });
    },
  });

  return {
    mentorships: data,
    active: data.filter((m) => m.status === "active"),
    pending: data.filter((m) => m.status === "pending"),
    loading: isLoading,
    isError,
    refetch,
    leave: leave.mutateAsync,
  };
}

/** The current user's standing with a single mentor, plus the join action. */
export function useMentorshipWith(mentorId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!user && !!mentorId && user.id !== mentorId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mentorshipWith", mentorId, user?.id],
    queryFn: () => fetchMentorshipWith(mentorId!, user!.id),
    enabled,
  });

  const join = useMutation({
    mutationFn: (note?: string) => requestMentorship(mentorId!, user!.id, note),
    onSuccess: () => {
      toast({ title: "Request sent", description: "The mentor will review your request." });
      queryClient.invalidateQueries({ queryKey: ["mentorshipWith", mentorId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["myMentorships", user?.id] });
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not send the request."), variant: "destructive" });
    },
  });

  const leave = useMutation({
    mutationFn: () => endMentorship(data!.id),
    onSuccess: () => {
      toast({ title: "You left the cohort" });
      queryClient.invalidateQueries({ queryKey: ["mentorshipWith", mentorId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["myMentorships", user?.id] });
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not leave the cohort."), variant: "destructive" });
    },
  });

  return {
    mentorship: data ?? null,
    status: data?.status ?? null,
    canRequest: enabled,
    loading: isLoading,
    refetch,
    join: join.mutateAsync,
    joining: join.isPending,
    leave: leave.mutateAsync,
  };
}

/** Admin side: assign many mentees to one mentor at once. */
export function useMentorAssignment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const assign = useMutation({
    mutationFn: ({ mentorId, menteeIds, note }: { mentorId: string; menteeIds: string[]; note?: string }) =>
      assignMenteesToMentor(mentorId, menteeIds, user!.id, note),
    onSuccess: (result, { mentorId }) => {
      const parts = [`${result.assigned} mentee${result.assigned === 1 ? "" : "s"} assigned`];
      if (result.skipped > 0) parts.push(`${result.skipped} already in the cohort`);
      toast({ title: "Cohort updated", description: parts.join(" · ") });
      queryClient.invalidateQueries({ queryKey: ["cohort", mentorId] });
      queryClient.invalidateQueries({ queryKey: ["adminCohort", mentorId] });
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not assign mentees."), variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; mentorId: string }) => removePairing(id),
    onSuccess: (_result, { mentorId }) => {
      toast({ title: "Pairing removed" });
      queryClient.invalidateQueries({ queryKey: ["cohort", mentorId] });
      queryClient.invalidateQueries({ queryKey: ["adminCohort", mentorId] });
    },
    onError: (error: unknown) => {
      toast({ title: "Error", description: errorMessage(error, "Could not remove the pairing."), variant: "destructive" });
    },
  });

  return {
    assign: assign.mutateAsync,
    assigning: assign.isPending,
    remove: remove.mutateAsync,
  };
}

/** Admin: read any mentor's cohort. */
export function useAdminCohort(mentorId: string | null) {
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["adminCohort", mentorId],
    queryFn: () => fetchCohort(mentorId!),
    enabled: !!mentorId,
  });

  useRealtimeSubscription(
    { table: "mentor_mentees", filter: mentorId ? `mentor_id=eq.${mentorId}` : undefined },
    () => queryClient.invalidateQueries({ queryKey: ["adminCohort", mentorId] }),
    !!mentorId,
  );

  return { cohort: data, loading: isLoading, isError, refetch };
}
