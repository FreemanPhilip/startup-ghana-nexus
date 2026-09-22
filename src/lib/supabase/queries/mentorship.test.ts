import { describe, it, expect, vi, beforeEach } from "vitest";

// A minimal in-memory stand-in for the parts of the Supabase client these
// functions touch. Each call records what it was asked to do so the tests can
// assert on the resulting writes rather than on implementation details.
interface Recorded {
  table: string;
  op: string;
  payload?: unknown;
  filters: Record<string, unknown>;
}

const recorded: Recorded[] = [];
let selectResult: { data: unknown; error: unknown } = { data: [], error: null };
let maybeSingleResult: { data: unknown; error: unknown } = { data: null, error: null };

const makeBuilder = (table: string, op: string) => {
  const entry: Recorded = { table, op, filters: {} };
  recorded.push(entry);

  const builder: Record<string, unknown> = {
    select: () => builder,
    order: () => builder,
    eq: (col: string, val: unknown) => {
      entry.filters[col] = val;
      return builder;
    },
    in: (col: string, val: unknown) => {
      entry.filters[col] = val;
      return builder;
    },
    maybeSingle: () => Promise.resolve(maybeSingleResult),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(selectResult).then(resolve),
  };
  return builder;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => makeBuilder(table, "select"),
      insert: (payload: unknown) => {
        const b = makeBuilder(table, "insert");
        recorded[recorded.length - 1].payload = payload;
        return b;
      },
      update: (payload: unknown) => {
        const b = makeBuilder(table, "update");
        recorded[recorded.length - 1].payload = payload;
        return b;
      },
      delete: () => makeBuilder(table, "delete"),
    }),
  },
}));

const { assignMenteesToMentor, requestMentorship, respondToRequest } = await import("./mentorship");

const MENTOR = "mentor-1";
const ADMIN = "admin-1";

beforeEach(() => {
  recorded.length = 0;
  selectResult = { data: [], error: null };
  maybeSingleResult = { data: null, error: null };
});

const writes = (op: string) => recorded.filter((r) => r.op === op && r.table === "mentor_mentees");

describe("assignMenteesToMentor", () => {
  it("inserts every mentee when the cohort is empty", async () => {
    selectResult = { data: [], error: null };

    const result = await assignMenteesToMentor(MENTOR, ["a", "b", "c"], ADMIN);

    expect(result).toEqual({ assigned: 3, skipped: 0 });
    const insert = writes("insert")[0];
    expect(insert.payload).toHaveLength(3);
    expect((insert.payload as Array<Record<string, unknown>>)[0]).toMatchObject({
      mentor_id: MENTOR,
      status: "active",
      source: "admin",
      assigned_by: ADMIN,
    });
  });

  it("does not duplicate mentees already active in the cohort", async () => {
    selectResult = { data: [{ id: "row-a", mentee_id: "a", status: "active" }], error: null };

    const result = await assignMenteesToMentor(MENTOR, ["a", "b"], ADMIN);

    expect(result).toEqual({ assigned: 1, skipped: 1 });
    const inserted = writes("insert")[0].payload as Array<Record<string, unknown>>;
    expect(inserted.map((r) => r.mentee_id)).toEqual(["b"]);
  });

  it("revives a previously declined pairing instead of inserting a duplicate", async () => {
    selectResult = { data: [{ id: "row-a", mentee_id: "a", status: "declined" }], error: null };

    const result = await assignMenteesToMentor(MENTOR, ["a"], ADMIN);

    expect(result).toEqual({ assigned: 1, skipped: 0 });
    expect(writes("insert")).toHaveLength(0);
    expect(writes("update")[0].payload).toMatchObject({ status: "active", source: "admin" });
  });

  it("ignores duplicates in the input and refuses to pair a mentor with themselves", async () => {
    selectResult = { data: [], error: null };

    const result = await assignMenteesToMentor(MENTOR, ["a", "a", MENTOR], ADMIN);

    expect(result).toEqual({ assigned: 1, skipped: 0 });
    const inserted = writes("insert")[0].payload as Array<Record<string, unknown>>;
    expect(inserted.map((r) => r.mentee_id)).toEqual(["a"]);
  });

  it("does nothing when given an empty list", async () => {
    const result = await assignMenteesToMentor(MENTOR, [], ADMIN);

    expect(result).toEqual({ assigned: 0, skipped: 0 });
    expect(recorded).toHaveLength(0);
  });
});

describe("requestMentorship", () => {
  it("creates a pending request when none exists", async () => {
    maybeSingleResult = { data: null, error: null };

    await requestMentorship(MENTOR, "mentee-1", "please help");

    expect(writes("insert")[0].payload).toMatchObject({
      mentor_id: MENTOR,
      mentee_id: "mentee-1",
      status: "pending",
      source: "request",
      note: "please help",
    });
  });

  it("is a no-op when a request is already pending", async () => {
    maybeSingleResult = { data: { id: "row-1", status: "pending" }, error: null };

    await requestMentorship(MENTOR, "mentee-1");

    expect(writes("insert")).toHaveLength(0);
    expect(writes("update")).toHaveLength(0);
  });

  it("is a no-op when already an active mentee", async () => {
    maybeSingleResult = { data: { id: "row-1", status: "active" }, error: null };

    await requestMentorship(MENTOR, "mentee-1");

    expect(writes("insert")).toHaveLength(0);
    expect(writes("update")).toHaveLength(0);
  });

  it("re-opens a declined request rather than inserting a duplicate pair", async () => {
    maybeSingleResult = { data: { id: "row-1", status: "declined" }, error: null };

    await requestMentorship(MENTOR, "mentee-1");

    expect(writes("insert")).toHaveLength(0);
    expect(writes("update")[0].payload).toMatchObject({ status: "pending", responded_at: null });
  });
});

describe("respondToRequest", () => {
  it("accepting moves the pairing to active", async () => {
    await respondToRequest("row-1", true);
    expect(writes("update")[0].payload).toMatchObject({ status: "active" });
  });

  it("declining moves the pairing to declined", async () => {
    await respondToRequest("row-1", false);
    expect(writes("update")[0].payload).toMatchObject({ status: "declined" });
  });
});
