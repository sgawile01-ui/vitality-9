import { useSyncExternalStore, type ReactNode } from "react";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
const listeners = new Set<() => void>();
let revision = 0;
let signedIn = true;
const cache = new Map<string, { value: unknown; error?: Error }>();
function emit() {
  revision++;
  listeners.forEach((fn) => fn());
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function useSession() {
  useSyncExternalStore(subscribe, () => revision);
  return signedIn;
}
export function setSession(value: boolean) {
  signedIn = value;
  emit();
}
const messages: Record<string, string> = {
  RATE_LIMITED: "Please wait a minute before sending another message.",
  LOCAL_BACKEND_UNAVAILABLE:
    "The local testing backend is unavailable. Restart the testing launcher.",
  INVALID_INPUT: "Please check the message or activity and try again.",
  PROVIDER_UNAVAILABLE: "Gemini is temporarily unavailable.",
  PROVIDER_TIMEOUT: "Gemini took too long to respond.",
  FORBIDDEN: "This action is unavailable in the testing app.",
};
export async function rpc(name: string, args: unknown = {}) {
  const response = await fetch("/_testing/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new ConvexError({
      code: data.error,
      message: messages[data.error] ?? "The request could not be completed safely.",
    });
  return data.result;
}
export function invalidate() {
  cache.clear();
  emit();
}
export function Authenticated({ children }: { children: ReactNode }) {
  return useSession() ? children : null;
}
export function Unauthenticated({ children }: { children: ReactNode }) {
  return useSession() ? null : children;
}
export function AuthLoading() {
  return null;
}
export function useQuery(ref: Parameters<typeof getFunctionName>[0], args: unknown = {}) {
  useSyncExternalStore(subscribe, () => revision);
  const name = getFunctionName(ref);
  const key = JSON.stringify([name, args]);
  if (!cache.has(key)) {
    const entry = { value: undefined } as { value: unknown; error?: Error };
    cache.set(key, entry);
    void rpc(name, args).then(
      (value) => {
        entry.value = value;
        emit();
      },
      (error) => {
        entry.error = error;
        emit();
      },
    );
  }
  const entry = cache.get(key)!;
  if (entry.error) throw entry.error;
  return entry.value;
}
export function useMutation(ref: Parameters<typeof getFunctionName>[0]) {
  return async (args: unknown) => {
    const result = await rpc(getFunctionName(ref), args);
    invalidate();
    return result;
  };
}
export function useAction(ref: Parameters<typeof getFunctionName>[0]) {
  return (args: unknown) => rpc(getFunctionName(ref), args);
}
