import { useCallback } from "react";
import { useAuth as useHerculesAuth } from "@usehercules/auth/react";
export { useUser } from "@usehercules/auth/react";

export function useAuth() {
  const auth = useHerculesAuth();
  const { signout: providerSignout, removeUser } = auth;
  const signout = useCallback(async () => {
    try {
      await providerSignout();
    } catch {
      // A failed discovery/logout request must not leave the local session active.
      await removeUser();
      throw new Error("Signed out locally. Provider sign-out could not be confirmed.");
    }
  }, [providerSignout, removeUser]);
  return { ...auth, signout };
}
