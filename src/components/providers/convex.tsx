import { ConvexProviderWithHerculesAuth } from "@usehercules/auth/convex-react";
import { ConvexReactClient } from "convex/react";

let convex: ConvexReactClient | undefined;

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  convex ??= new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
  return (
    <ConvexProviderWithHerculesAuth client={convex}>{children}</ConvexProviderWithHerculesAuth>
  );
}
