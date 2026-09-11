// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { getFunctionName } from "convex/server";
import Home from "../src/pages/home/page";
import Progress from "../src/pages/progress/page";
import Profile from "../src/pages/profile/page";
import AppLayout from "../src/pages/AppLayout";
import AuthCallback from "../src/pages/auth/Callback";
import AiCoachChat from "../src/pages/home/_components/AiCoachChat";
import { CHALLENGE_DAYS } from "../convex/challengeData";
const state = vi.hoisted(() => ({
  authenticated: true,
  loading: false,
  empty: false,
  isPro: true,
  callbackError: false,
  mutation: vi.fn(),
  action: vi.fn(),
  signin: vi.fn(),
  signout: vi.fn(),
}));
vi.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: ReactNode }) =>
    state.authenticated && !state.loading ? children : null,
  Unauthenticated: ({ children }: { children: ReactNode }) =>
    !state.authenticated && !state.loading ? children : null,
  AuthLoading: ({ children }: { children: ReactNode }) => (state.loading ? children : null),
  useConvexAuth: () => ({ isAuthenticated: state.authenticated }),
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    if (state.loading) return undefined;
    const name = getFunctionName(ref);
    if (name === "users:getCurrentUser")
      return {
        _id: "synthetic",
        name: "Synthetic Tester",
        email: "synthetic@example.invalid",
        isPro: state.isPro,
        currentChallengeDay: 1,
        streakCount: 0,
      };
    if (name === "tasks:getTasksForDay")
      return state.empty
        ? []
        : CHALLENGE_DAYS[0].tasks.map((taskText, taskIndex) => ({
            taskText,
            taskIndex,
            isCompleted: false,
          }));
    return [];
  },
  useMutation: () => state.mutation,
  useAction: () => state.action,
}));
vi.mock("@usehercules/auth/react", () => ({
  useAuth: () => ({ signin: state.signin, signout: state.signout }),
  useAuthCallback: () => ({
    status: state.callbackError ? "error" : "loading",
    error: state.callbackError ? "synthetic internal error" : null,
    retry: vi.fn(),
  }),
}));
beforeEach(() => {
  state.authenticated = true;
  state.loading = false;
  state.empty = false;
  state.isPro = true;
  state.callbackError = false;
  vi.clearAllMocks();
  state.mutation.mockResolvedValue(null);
  state.action.mockResolvedValue({ reply: "Synthetic wellness response." });
  state.signin.mockResolvedValue(undefined);
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
function pages(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}
it("home loads nine tasks and submits completion", async () => {
  pages();
  const button = screen.getByRole("button", { name: CHALLENGE_DAYS[0].tasks[0] });
  expect(button.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(button);
  await waitFor(() =>
    expect(state.mutation).toHaveBeenCalledWith({ dayNumber: 1, taskIndex: 0, isCompleted: true }),
  );
});
it("navigation reaches progress and profile", () => {
  pages();
  fireEvent.click(screen.getByRole("button", { name: "Progress" }));
  expect(screen.getByRole("heading", { name: "Your Progress" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Profile" }));
  expect(screen.getByRole("heading", { name: "Profile" })).toBeTruthy();
});
it("profile editing submits bounded name", async () => {
  pages("/profile");
  fireEvent.click(screen.getByRole("button", { name: "Edit name" }));
  const input = screen.getByRole("textbox", { name: "Your name" });
  expect(input.getAttribute("maxlength")).toBe("100");
  fireEvent.change(input, { target: { value: "Synthetic Renamed" } });
  fireEvent.click(screen.getByRole("button", { name: "Save name" }));
  await waitFor(() => expect(state.mutation).toHaveBeenCalledWith({ name: "Synthetic Renamed" }));
});
it.each(["/", "/progress", "/profile"])("unauthenticated route %s is gated", (path) => {
  state.authenticated = false;
  pages(path);
  expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  expect(screen.queryByText("Synthetic Tester")).toBeNull();
});
it("loading and empty tasks have accessible states", () => {
  state.loading = true;
  const view = pages();
  expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  view.unmount();
  state.loading = false;
  state.empty = true;
  pages();
  expect(screen.getByText(/No activities are available/)).toBeTruthy();
});
it("chat Enter sends message and retains synthetic history", async () => {
  render(<AiCoachChat onClose={vi.fn()} />);
  const input = screen.getByRole("textbox", { name: "Message to wellness coach" });
  fireEvent.change(input, { target: { value: "Help with sleep" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() =>
    expect(state.action).toHaveBeenCalledWith({ message: "Help with sleep", history: [] }),
  );
  await screen.findByText("Synthetic wellness response.");
  fireEvent.change(input, { target: { value: "Now gratitude" } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() =>
    expect(state.action).toHaveBeenLastCalledWith({
      message: "Now gratitude",
      history: [
        { role: "user", text: "Help with sleep" },
        { role: "model", text: "Synthetic wellness response." },
      ],
    }),
  );
});
it("chat network error returns safe UI feedback", async () => {
  state.action.mockRejectedValue(new Error("synthetic internal disclosure"));
  render(<AiCoachChat onClose={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText(/try again in a moment/);
  expect(screen.queryByText("synthetic internal disclosure")).toBeNull();
});
it("callback failure hides internal detail and offers retry", () => {
  state.callbackError = true;
  render(
    <MemoryRouter>
      <AuthCallback />
    </MemoryRouter>,
  );
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  expect(screen.queryByText("synthetic internal error")).toBeNull();
});
