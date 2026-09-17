import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import AppLayout from "./pages/AppLayout.tsx";
import Home from "./pages/home/page.tsx";
import Progress from "./pages/progress/page.tsx";
import Profile from "./pages/profile/page.tsx";
import NotFound from "./pages/NotFound.tsx";
import { BetaGate } from "./components/BetaGate";

export default function App() {
  if (
    !import.meta.env.VITE_CONVEX_URL ||
    !import.meta.env.VITE_HERCULES_OIDC_AUTHORITY ||
    !import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID
  ) {
    return (
      <main className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold">Vitality 9</h1>
        <p>Nine pillars. A gentle, nine-day wellness journey.</p>
        <h2 className="text-xl font-semibold">Local setup required</h2>
        <p role="status">
          Sign in and saved journeys will be available after the local backend and authentication
          are configured.
        </p>
        <p>Developers: follow README.md and .env.example, then restart the development server.</p>
        <p>
          General wellness education only. For urgent symptoms or immediate danger, contact local
          emergency services now.
        </p>
      </main>
    );
  }
  return (
    <DefaultProviders>
      <BrowserRouter>
        <BetaGate>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BetaGate>
      </BrowserRouter>
    </DefaultProviders>
  );
}
