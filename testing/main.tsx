import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "../src/components/ui/sonner";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import AppLayout from "../src/pages/AppLayout";
import Home from "../src/pages/home/page";
import Progress from "../src/pages/progress/page";
import Profile from "../src/pages/profile/page";
import { rpc, invalidate } from "./convex";
import "../src/index.css";
function Testing() {
  const [resetting, setResetting] = useState(false);
  return (
    <>
      <header className="max-w-md mx-auto p-3 bg-accent text-accent-foreground text-sm">
        <strong>Vitality 9 · Synthetic testing</strong>
        <p>
          Use invented details only. Test account enabled; payments off. Coach uses labelled offline
          replies when Gemini is not connected.
        </p>
        <button
          disabled={resetting}
          className="underline mt-2 min-h-11"
          onClick={async () => {
            if (
              !window.confirm("Restart this synthetic journey and clear its completed activities?")
            )
              return;
            setResetting(true);
            try {
              await rpc("tasks:resetChallenge");
              invalidate();
              toast.success("Testing journey restarted.");
            } catch {
              toast.error("Could not restart the journey.");
            } finally {
              setResetting(false);
            }
          }}
        >
          {resetting ? "Restarting…" : "Restart testing journey"}
        </button>
      </header>
      <MemoryRouter>
        <Toaster />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Testing />
  </ErrorBoundary>,
);
