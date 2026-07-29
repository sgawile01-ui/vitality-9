import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { motion } from "motion/react";
import { CheckCircle2Icon, CircleIcon, FlameIcon, TrophyIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { CHALLENGE_DAYS_FE } from "../home/_lib/challengeData.ts";

function DayCalendarItem({ day, status, theme, pillar, delay }: { day: number; status: "completed" | "current" | "future"; theme: string; pillar: string; delay: number; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all", status === "completed" && "bg-primary/8 border-primary/20", status === "current" && "bg-accent border-primary/30 shadow-sm", status === "future" && "bg-card border-border opacity-60")}>
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm", status === "completed" && "bg-primary text-primary-foreground", status === "current" && "bg-primary/20 text-primary", status === "future" && "bg-muted text-muted-foreground")}>
        {status === "completed" ? <CheckCircle2Icon size={20} /> : day}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{theme}</p>
        <p className="text-xs text-muted-foreground truncate italic">{pillar}</p>
      </div>
      {status === "current" && <span className="text-xs font-semibold text-primary bg-primary/12 px-2.5 py-1 rounded-full shrink-0">Today</span>}
      {status === "future" && <CircleIcon size={16} className="text-border shrink-0" />}
    </motion.div>
  );
}

function ProgressInner() {
  const user = useQuery(api.users.getCurrentUser, {});
  const allTasks = useQuery(api.tasks.getAllUserTasks, {});

  if (user === undefined || allTasks === undefined) {
    return (
      <div className="px-5 pt-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
      </div>
    );
  }

  const currentDay = user?.currentChallengeDay ?? 1;
  const streak = user?.streakCount ?? 0;
  const completedDays = new Set<number>();
  const tasksByDay = new Map<number, typeof allTasks>();
  for (const task of allTasks) { const dayTasks = tasksByDay.get(task.dayNumber) ?? []; tasksByDay.set(task.dayNumber, [...dayTasks, task]); }
  for (const [dayNum, tasks] of tasksByDay.entries()) { if (tasks.filter((t) => t.isCompleted).length >= 3) completedDays.add(dayNum); }
  const totalCompleted = completedDays.size;
  const progressPct = Math.round((totalCompleted / 9) * 100);

  return (
    <div className="px-5 pt-8 pb-4 space-y-6">
      <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>Your Progress</motion.h1>
      <motion.div className="grid grid-cols-3 gap-3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="bg-card border border-border rounded-2xl p-3 text-center"><FlameIcon size={20} className="text-primary mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{streak}</p><p className="text-[10px] text-muted-foreground font-medium">Day Streak</p></div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center"><TrophyIcon size={20} className="text-primary mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{totalCompleted}</p><p className="text-[10px] text-muted-foreground font-medium">Days Done</p></div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center"><CalendarIcon size={20} className="text-primary mx-auto mb-1" /><p className="text-xl font-bold text-foreground">{progressPct}%</p><p className="text-[10px] text-muted-foreground font-medium">Complete</p></div>
      </motion.div>
      <motion.div className="bg-card border border-border rounded-3xl p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex justify-between mb-3"><p className="text-sm font-semibold">Challenge Progress</p><p className="text-sm font-bold text-primary">{totalCompleted}/9 days</p></div>
        <div className="h-3 bg-muted rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} /></div>
        <div className="flex justify-between mt-2"><span className="text-xs text-muted-foreground">Day 1</span><span className="text-xs text-muted-foreground">Day 9</span></div>
      </motion.div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">9-Day Consciousness Journey</h3>
        {CHALLENGE_DAYS_FE.map((dayData, i) => {
          const dayNum = i + 1;
          const status = completedDays.has(dayNum) ? "completed" : dayNum === currentDay ? "current" : "future";
          return <DayCalendarItem key={dayNum} day={dayNum} status={status} theme={dayData.theme} pillar={dayData.pillar} delay={0.1 + i * 0.05} />;
        })}
      </div>
    </div>
  );
}

export default function Progress() {
  return (
    <>
      <AuthLoading><div className="px-5 pt-8 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div></AuthLoading>
      <Unauthenticated><div className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-4"><TrophyIcon size={40} className="text-primary" /><p className="text-muted-foreground">Sign in to track your progress</p><SignInButton /></div></Unauthenticated>
      <Authenticated><ProgressInner /></Authenticated>
    </>
  );
}
