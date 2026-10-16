import { setSession } from "./convex";
export function useAuth() {
  return { signin: async () => setSession(true), signout: async () => setSession(false) };
}
export function useUser() {
  return null;
}
