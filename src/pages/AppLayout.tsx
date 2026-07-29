import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { HomeIcon, BarChart2Icon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const NAV_ITEMS = [
  { label: "Home", icon: HomeIcon, path: "/" },
  { label: "Progress", icon: BarChart2Icon, path: "/progress" },
  { label: "Profile", icon: UserIcon, path: "/profile" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-sm border-t border-border z-50">
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname === path;
            return (
              <button key={path} onClick={() => navigate(path)} className={cn("flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 cursor-pointer", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <div className={cn("p-1.5 rounded-lg transition-all duration-200", isActive && "bg-primary/10")}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={cn("text-[11px] font-medium", isActive && "font-semibold")}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
