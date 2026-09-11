import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { toast } from "sonner";
export function SignInButton({ className }: { className?: string }) {
  const { signin } = useAuth();
  return (
    <Button
      className={className}
      onClick={() => {
        void signin().catch(() => toast.error("Sign in is unavailable. Please try again."));
      }}
    >
      Sign in
    </Button>
  );
}
