import { useSyncExternalStore, type ReactNode } from "react";
import { getFunctionName } from "convex/server";
import { CHALLENGE_DAYS } from "../../convex/challengeData";
const listeners = new Set<() => void>();
let revision = 0;
const user = {
  name: "Synthetic Tester",
  email: "synthetic@example.invalid",
  isPro: true,
  currentChallengeDay: 1,
  streakCount: 0,
};
const done = new Set<number>();
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
function update() {
  revision++;
  for (const listener of listeners) listener();
}
export function Authenticated({ children }: { children: ReactNode }) {
  return children;
}
export function Unauthenticated() {
  return null;
}
export function AuthLoading() {
  return null;
}
export function useQuery(ref: Parameters<typeof getFunctionName>[0]) {
  useSyncExternalStore(subscribe, () => revision);
  const name = getFunctionName(ref);
  if (name === "users:getCurrentUser") return { ...user };
  const tasks = CHALLENGE_DAYS[0].tasks.map((taskText, taskIndex) => ({
    _id: String(taskIndex),
    dayNumber: 1,
    taskText,
    taskIndex,
    isCompleted: done.has(taskIndex),
  }));
  return name === "tasks:getTasksForDay" ? tasks : tasks.filter((t) => t.isCompleted);
}
export function useMutation(ref: Parameters<typeof getFunctionName>[0]) {
  return async (args: { taskIndex?: number; isCompleted?: boolean; name?: string }) => {
    if (getFunctionName(ref) === "users:updateProfile") {
      user.name = args.name!;
    } else if (args.taskIndex !== undefined) {
      if (args.isCompleted) done.add(args.taskIndex);
      else done.delete(args.taskIndex);
    }
    update();
  };
}
export function useAction() {
  return async () => ({
    reply:
      "Synthetic provider fixture: choose a comfortable wellness habit. General education only.",
  });
}
