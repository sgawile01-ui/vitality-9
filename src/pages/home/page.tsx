import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2Icon, CircleIcon, HeartPulseIcon, SparklesIcon, Droplets, Footprints, Brain, BotIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CHALLENGE_DAYS_FE } from "./_lib/challengeData.ts";
import AiCoachChat from "./_components/AiCoachChat.tsx";
import ProUpsellModal from "./_components/ProUpsellModal.tsx";

function ProgressCircle({ day, totalDays = 9 }: { day: number; totalDays?: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = ((day - 1) / totalDays) * circumference;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="oklch(0.9 0.012 200)" strokeWidth="12" />
        <motion.circle cx="90" cy="90" r={radius} fill="none" stroke="oklch(0.58 0.13 195)" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - progress }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span className="text-4xl font-bold text-primary" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>{day}</motion.span>
        <span className="text-sm text-muted-foreground font-medium">of {totalDays} days</span>
      </div>
    </div>
  );
}

const TASK_ICONS = [Droplets, Footprints, Brain];

function TaskItem({ task, index, onToggle }: { task: { taskText: string; isCompleted: boolean; taskIndex: number }; index: number; onToggle: (taskIndex: number, isCompleted: boolean) => void; }) {
  const Icon = TASK_ICONS[index % TASK_ICONS.length];
  return (
    <motion.button layout onClick={() => onToggle(task.taskIndex, !task.isCompleted)} className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer", task.isCompleted ? "bg-primary/8 border-primary/20" : "bg-card border-border hover:border-primary/30 hover:bg-primary/4")} whileTap={{ scale: 0.97 }}>
      <div className={cn("shrink-0 p-2 rounded-xl transition-colors", task.isCompleted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}><Icon size={18} /></div>
      <span className={cn("flex-1 text-sm font-medium", task.isCompleted && "line-through text-muted-foreground")}>{task.taskText}</span>
      <AnimatePresence mode="wait">
        {task.isCompleted ? (
          <motion.div key="checked" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}><CheckCircle2Icon size={22} className="text-primary shrink-0" /></motion.div>
        ) : (
          <motion.div key="unchecked" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}><CircleIcon size={22} className="text-border shrink-0" /></motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function HomeInner() {
  const user = useQuery(api.users.getCurrentUser, {});
  const currentDay = user?.currentChallengeDay ?? 1;
  const tasks = useQuery(api.tasks.getTasksForDay, { dayNumber: currentDay });
  const toggleTask = useMutation(api.tasks.toggleTask);
  const [chatOpen, setChatOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("pro") === "success") {
      toast.success("Welcome to Vitality 9 Pro! AI coaching is now unlocked.", { duration: 5000 });
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  const dayData = CHALLENGE_DAYS_FE[currentDay - 1];
  const completedCount = tasks?.filter((t) => t.isCompleted).length ?? 0;
  const totalCount = tasks?.length ?? 3;

  const handleToggle = async (taskIndex: number, isCompleted: boolean) => {
    try {
      await toggleTask({ dayNumber: currentDay, taskIndex, isCompleted });
      if (isCompleted) toast.success("Task completed! Keep going! 🌿");
    } catch { toast.error("Failed to update task"); }
  };

  if (user === undefined || tasks === undefined) {
    return (
      <div className="px-5 pt-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 pb-4 space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Good day,</p>
          <h1 className="text-xl font-bold text-foreground">{user?.name?.split(" ")[0] ?? "Wellness Seeker"} ✨</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-accent px-3 py-1.5 rounded-full">
          <HeartPulseIcon size={14} className="text-primary" />
          <span className="text-xs font-semibold text-accent-foreground">{user?.streakCount ?? 0} day streak</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-card rounded-3xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pillar {currentDay} of 9</p>
            <h2 className="text-lg font-bold">{dayData?.theme}</h2>
            <p className="text-xs text-muted-foreground italic">{dayData?.pillar}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Today's tasks</p>
            <p className="text-lg font-bold text-primary">{completedCount}/{totalCount}</p>
          </div>
        </div>
        <div className="flex justify-center"><ProgressCircle day={currentDay} /></div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Daily progress</span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${(completedCount / totalCount) * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Day {currentDay} · {dayData?.theme}</h3>
        {tasks.map((task, index) => <TaskItem key={task.taskIndex} task={task} index={index} onToggle={handleToggle} />)}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="bg-gradient-to-br from-primary/10 to-accent/60 rounded-3xl p-5 border border-primary/15">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-primary/15 rounded-lg"><SparklesIcon size={16} className="text-primary" /></div>
          <p className="text-xs font-bold text-primary uppercase tracking-wide">Pillar Insight</p>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dayData?.tip}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
        <button onClick={() => { if (user?.isPro) { setChatOpen((prev) => !prev); } else { setUpsellOpen(true); } }} className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer", user?.isPro ? "bg-gradient-to-r from-primary/10 to-accent/50 border-primary/20 hover:border-primary/40" : "bg-card border-border hover:border-primary/20 hover:bg-primary/4")}>
          <div className={cn("p-2 rounded-xl shrink-0", user?.isPro ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}><BotIcon size={18} /></div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">{user?.isPro ? "AI Health Coach" : "Chat with AI Coach"}</p>
            <p className="text-xs text-muted-foreground">{user?.isPro ? "Ask Gemini anything about your wellness" : "Pro feature — upgrade to unlock"}</p>
          </div>
          {user?.isPro ? (
            <motion.div animate={{ rotate: chatOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDownIcon size={16} className="text-muted-foreground" /></motion.div>
          ) : (
            <SparklesIcon size={15} className="text-primary shrink-0" />
          )}
        </button>
        <AnimatePresence>
          {chatOpen && user?.isPro && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden mt-3">
              <AiCoachChat onClose={() => setChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {upsellOpen && <ProUpsellModal onClose={() => setUpsellOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <AuthLoading>
        <div className="px-5 pt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-6">
          <div className="p-4 bg-primary/10 rounded-full"><HeartPulseIcon size={40} className="text-primary" /></div>
          <h1 className="text-3xl font-bold text-foreground">Vitality 9</h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">Your 9-Day Consciousness &amp; Vitality Journey. Nine pillars. One transformation.</p>
          <SignInButton className="w-full max-w-xs" />
        </div>
      </Unauthenticated>
      <Authenticated><HomeInner /></Authenticated>
    </>
  );
}
