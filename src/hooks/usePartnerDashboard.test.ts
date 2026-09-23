import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}));

const { programStatus } = await import("./usePartnerDashboard");

describe("programStatus", () => {
  const today = "2026-09-23";

  it("treats a future deadline as open", () => {
    expect(programStatus("2026-12-01", today)).toBe("Open");
  });

  it("treats today's deadline as still open", () => {
    expect(programStatus(today, today)).toBe("Open");
  });

  it("treats a past deadline as closed", () => {
    expect(programStatus("2026-01-01", today)).toBe("Closed");
  });

  it("treats a missing deadline as rolling rather than closed", () => {
    // An opportunity with no deadline should not be counted as expired — that
    // would silently drop open programs from the partner's active count.
    expect(programStatus(null, today)).toBe("Rolling");
  });
});
