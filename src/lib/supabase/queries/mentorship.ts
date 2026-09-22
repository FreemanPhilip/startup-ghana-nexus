import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MentorMenteeRow = Database["public"]["Tables"]["mentor_mentees"]["Row"];
export type MentorshipStatus = "pending" | "active" | "declined" | "ended";

export interface CohortMember extends MentorMenteeRow {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

interface PublicProfileLite {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

async function attachProfiles(rows: MentorMenteeRow[], key: "mentee_id" | "mentor_id"): Promise<CohortMember[]> {
  if (rows.length === 0) return [];

  const ids = Array.from(new Set(rows.map((r) => r[key])));
  const { data: profiles, error } = await supabase
    .from("public_profiles")
    .select("user_id, full_name, avatar_url, headline")
    .in("user_id", ids);

  if (error) throw error;

  const byId = new Map<string, PublicProfileLite>(
    (profiles ?? [])
      .filter((p): p is PublicProfileLite => typeof p.user_id === "string")
      .map((p) => [p.user_id, p]),
  );

  return rows.map((row) => {
    const profile = byId.get(row[key]);
    return {
      ...row,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      headline: profile?.headline ?? null,
    };
  });
}

/** Everyone in (or asking to join) a mentor's cohort. */
export async function fetchCohort(mentorId: string): Promise<CohortMember[]> {
  const { data, error } = await supabase
    .from("mentor_mentees")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return attachProfiles(data ?? [], "mentee_id");
}

/** The cohorts a mentee belongs to, or has asked to join. */
export async function fetchMyMentorships(menteeId: string): Promise<CohortMember[]> {
  const { data, error } = await supabase
    .from("mentor_mentees")
    .select("*")
    .eq("mentee_id", menteeId)
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return attachProfiles(data ?? [], "mentor_id");
}

/** The current user's relationship with one mentor, if any. */
export async function fetchMentorshipWith(
  mentorId: string,
  menteeId: string,
): Promise<MentorMenteeRow | null> {
  const { data, error } = await supabase
    .from("mentor_mentees")
    .select("*")
    .eq("mentor_id", mentorId)
    .eq("mentee_id", menteeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Ask to join a mentor's cohort. A previously declined or ended row is reused
 * rather than inserted again, because (mentor_id, mentee_id) is unique.
 */
export async function requestMentorship(
  mentorId: string,
  menteeId: string,
  note?: string,
): Promise<void> {
  const existing = await fetchMentorshipWith(mentorId, menteeId);

  if (existing) {
    if (existing.status === "pending" || existing.status === "active") return;

    const { error } = await supabase
      .from("mentor_mentees")
      .update({ status: "pending", note: note ?? null, requested_at: new Date().toISOString(), responded_at: null })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("mentor_mentees").insert({
    mentor_id: mentorId,
    mentee_id: menteeId,
    status: "pending",
    source: "request",
    note: note ?? null,
  });
  if (error) throw error;
}

/** Mentor answers a pending request. */
export async function respondToRequest(id: string, accept: boolean): Promise<void> {
  const { error } = await supabase
    .from("mentor_mentees")
    .update({
      status: accept ? "active" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** End an active mentorship (either side). */
export async function endMentorship(id: string): Promise<void> {
  const { error } = await supabase
    .from("mentor_mentees")
    .update({ status: "ended", responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export interface BulkAssignResult {
  assigned: number;
  skipped: number;
}

/**
 * Admin: put many mentees into one mentor's cohort in a single call.
 *
 * Pairs that already exist are revived rather than duplicated, so re-running an
 * assignment is safe and a previously declined pair can be reinstated.
 */
export async function assignMenteesToMentor(
  mentorId: string,
  menteeIds: string[],
  assignedBy: string,
  note?: string,
): Promise<BulkAssignResult> {
  const candidates = Array.from(new Set(menteeIds)).filter((id) => id && id !== mentorId);
  if (candidates.length === 0) return { assigned: 0, skipped: 0 };

  const { data: existing, error: existingError } = await supabase
    .from("mentor_mentees")
    .select("id, mentee_id, status")
    .eq("mentor_id", mentorId)
    .in("mentee_id", candidates);

  if (existingError) throw existingError;

  const existingByMentee = new Map((existing ?? []).map((row) => [row.mentee_id, row]));
  const alreadyActive = (existing ?? []).filter((row) => row.status === "active");
  const toRevive = (existing ?? []).filter((row) => row.status !== "active");
  const toInsert = candidates.filter((id) => !existingByMentee.has(id));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("mentor_mentees").insert(
      toInsert.map((menteeId) => ({
        mentor_id: mentorId,
        mentee_id: menteeId,
        status: "active",
        source: "admin",
        assigned_by: assignedBy,
        note: note ?? null,
        responded_at: new Date().toISOString(),
      })),
    );
    if (error) throw error;
  }

  if (toRevive.length > 0) {
    const { error } = await supabase
      .from("mentor_mentees")
      .update({
        status: "active",
        source: "admin",
        assigned_by: assignedBy,
        note: note ?? null,
        responded_at: new Date().toISOString(),
      })
      .in(
        "id",
        toRevive.map((row) => row.id),
      );
    if (error) throw error;
  }

  return { assigned: toInsert.length + toRevive.length, skipped: alreadyActive.length };
}

/** Admin: remove a pairing outright. */
export async function removePairing(id: string): Promise<void> {
  const { error } = await supabase.from("mentor_mentees").delete().eq("id", id);
  if (error) throw error;
}
