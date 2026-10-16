import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "../../src/components/ui/sonner";
import AppLayout from "../../src/pages/AppLayout";
import Home from "../../src/pages/home/page";
import Progress from "../../src/pages/progress/page";
import Profile from "../../src/pages/profile/page";
import "../../src/index.css";
createRoot(document.getElementById("root")!).render(
  <MemoryRouter>
    <header className="text-center text-sm">Synthetic UI fixture · mocked services</header>
    <Toaster />
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);
