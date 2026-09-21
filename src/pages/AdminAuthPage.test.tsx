import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAuthPage from "./AdminAuthPage";

const { mockRpc, mockAuth } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockAuth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    updateUser: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    auth: mockAuth,
    from: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: null,
    roles: [],
    loading: false,
  }),
}));

describe("AdminAuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: false, error: null });
  });

  it("opens the first-admin setup flow when no admin accounts exist yet", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/login"]}>
        <AdminAuthPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Create Admin Account/i })).toBeTruthy();
    });
  });
});
