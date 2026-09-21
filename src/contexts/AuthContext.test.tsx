import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const { mockAuth, mockFrom } = vi.hoisted(() => ({
  mockAuth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    }),
  },
  mockFrom: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: mockAuth,
    from: mockFrom,
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { subscribed: false } }),
    },
    removeChannel: vi.fn(),
  },
}));

function TestConsumer() {
  const { loading, profile, roles } = useAuth();

  return (
    <div>
      <span>{loading ? "loading" : "ready"}</span>
      <span>{profile ? `profile:${profile.user_id}` : "profile:missing"}</span>
      <span>{roles.length}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  it("keeps the app usable when no profile row exists yet for a signed-in user", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [] }),
      };
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeTruthy();
    });

    expect(screen.getByText("profile:missing")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });
});
