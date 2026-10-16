import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function BetaGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const access = useQuery(api.beta.access, isAuthenticated ? {} : "skip");
  const { signout } = useAuth();
  if (isLoading || (isAuthenticated && !access))
    return (
      <p role="status" className="p-6">
        Checking beta access…
      </p>
    );
  if (isAuthenticated && !access?.allowed)
    return (
      <main className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Vitality 9 private beta</h1>
        <p>This beta is invitation-only. Ask the organizer to add your account.</p>
        <Button
          onClick={() =>
            void signout().catch(() =>
              toast.error("Provider sign-out could not be confirmed. Please try again."),
            )
          }
        >
          Sign out
        </Button>
      </main>
    );
  return (
    <>
      {access?.restricted && (
        <p className="text-center text-xs p-2">
          Private beta · General wellness education · No live payments
        </p>
      )}
      {children}
    </>
  );
}
