// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, renderHook, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider } from "../src/components/providers/auth";
import { BetaGate } from "../src/components/BetaGate";
import AuthCallback from "../src/pages/auth/Callback";
import { useAuth } from "../src/hooks/use-auth";

const state = vi.hoisted(() => ({
  authenticated: false,
  loading: false,
  access: undefined as { restricted: boolean; allowed: boolean } | undefined,
  providerProps: {} as Record<string, unknown>,
  callback: {} as { isBackendAuthenticated?: boolean; onSync?: () => Promise<void> },
  signout: vi.fn(),
  removeUser: vi.fn(),
  updateUser: vi.fn(),
  query: vi.fn(),
}));
vi.mock("@usehercules/auth/react", () => ({
  HerculesAuthProvider: (props: { children: ReactNode }) => {
    state.providerProps = props;
    return props.children;
  },
  useAuth: () => ({ signout: state.signout, removeUser: state.removeUser }),
  useAuthCallback: (options: typeof state.callback) => {
    state.callback = options;
    return { status: "waiting-backend" };
  },
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: state.authenticated, isLoading: state.loading }),
  useQuery: (_ref: unknown, args: unknown) => {
    state.query(args);
    return args === "skip" ? undefined : state.access;
  },
  useMutation: () => state.updateUser,
}));
beforeEach(() => {
  vi.resetAllMocks();
  state.authenticated = false;
  state.loading = false;
  state.access = undefined;
  state.signout.mockResolvedValue(undefined);
  state.removeUser.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it("pins code flow, PKCE and exact same-origin callbacks despite legacy overrides", () => {
  vi.stubEnv("VITE_HERCULES_OIDC_RESPONSE_TYPE", "token");
  vi.stubEnv("VITE_HERCULES_OIDC_REDIRECT_URI", "https://example.invalid/callback");
  render(
    <AuthProvider>
      <p>Application</p>
    </AuthProvider>,
  );
  expect(state.providerProps.userManagerSettings).toMatchObject({
    response_type: "code",
    disablePKCE: false,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: window.location.origin,
  });
});
it("waits for backend authentication and invitation approval before rendering children", () => {
  state.loading = true;
  const view = render(
    <BetaGate>
      <p>Protected child</p>
    </BetaGate>,
  );
  expect(screen.queryByText("Protected child")).toBeNull();
  expect(state.query).toHaveBeenLastCalledWith("skip");
  state.loading = false;
  state.authenticated = true;
  view.rerender(
    <BetaGate>
      <p>Protected child</p>
    </BetaGate>,
  );
  expect(screen.queryByText("Protected child")).toBeNull();
  state.access = { restricted: true, allowed: true };
  view.rerender(
    <BetaGate>
      <p>Protected child</p>
    </BetaGate>,
  );
  expect(screen.getByText("Protected child")).toBeTruthy();
  state.access = { restricted: false, allowed: false };
  view.rerender(
    <BetaGate>
      <p>Protected child</p>
    </BetaGate>,
  );
  expect(screen.queryByText("Protected child")).toBeNull();
  expect(screen.getByText(/invitation-only/)).toBeTruthy();
});
it("session loss stops the beta query; signed-out routes retain their own sign-in gates", () => {
  render(
    <BetaGate>
      <p>Public sign-in route</p>
    </BetaGate>,
  );
  expect(state.query).toHaveBeenLastCalledWith("skip");
  expect(screen.getByText("Public sign-in route")).toBeTruthy();
});
it("successful logout uses the provider logout flow", async () => {
  const { result } = renderHook(() => useAuth());
  await act(async () => result.current.signout());
  expect(state.signout).toHaveBeenCalledOnce();
  expect(state.removeUser).not.toHaveBeenCalled();
});
it("failed provider logout clears local credentials and reports only a safe error", async () => {
  state.signout.mockRejectedValue(new Error("private provider details"));
  const { result } = renderHook(() => useAuth());
  await expect(result.current.signout()).rejects.toThrow(
    "Signed out locally. Provider sign-out could not be confirmed.",
  );
  expect(state.removeUser).toHaveBeenCalledOnce();
});
it("callback waits on Convex; null or failed user sync cannot report success or leak details", async () => {
  render(
    <MemoryRouter>
      <AuthCallback />
    </MemoryRouter>,
  );
  expect(state.callback.isBackendAuthenticated).toBe(false);
  expect(state.updateUser).not.toHaveBeenCalled();
  state.updateUser.mockResolvedValue(null);
  await expect(state.callback.onSync!()).rejects.toThrow(
    "Sign in could not be completed. Please try again.",
  );
  state.updateUser.mockRejectedValue(new Error("private backend details"));
  await expect(state.callback.onSync!()).rejects.toThrow(
    "Sign in could not be completed. Please try again.",
  );
  state.updateUser.mockResolvedValue("synthetic-user-id");
  await expect(state.callback.onSync!()).resolves.toBeUndefined();
});
