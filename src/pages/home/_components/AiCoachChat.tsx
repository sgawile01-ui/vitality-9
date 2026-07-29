import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { SendIcon, BotIcon, UserIcon, XIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { ConvexError } from "convex/values";

type Message = { id: string; role: "user" | "model"; text: string; };

const SUGGESTED_PROMPTS = [
  "What should I focus on for better sleep?",
  "How can I build a morning hydration habit?",
  "Give me a 5-minute breathwork exercise",
  "How does nutrition affect my mood?",
];

export default function AiCoachChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", role: "model", text: "Hello! I'm your Vitality 9 AI Health Coach. I'm here to support your 9-pillar wellness journey with evidence-based guidance. What would you like to explore today?" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sendMessage = useAction(api.aiCoach.chat);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: messageText }]);
    setInput("");
    setIsLoading(true);
    const history = messages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, text: m.text }));
    try {
      const { reply } = await sendMessage({ message: messageText, history });
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", text: reply }]);
    } catch (err) {
      let friendlyMessage = "👤 AI is taking a nap — please try again in a moment.";
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; message?: string };
        if (data.code === "UNAUTHENTICATED") friendlyMessage = "Please sign in to use the AI Coach.";
        else if (data.code === "FORBIDDEN") friendlyMessage = "AI coaching requires a Pro subscription. Tap 'Get Pro' to upgrade.";
        else if (data.code === "BAD_REQUEST") friendlyMessage = "⚙️ AI Coach isn't configured yet. Make sure the GOOGLE_API_KEY secret is set.";
        else if (data.message) friendlyMessage = `👤 ${data.message}`;
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", text: friendlyMessage }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-lg" style={{ height: "520px" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/8 to-accent/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center"><BotIcon size={16} className="text-primary" /></div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">AI Health Coach</p>
            <p className="text-[10px] text-primary font-medium mt-0.5">Powered by Gemini · Pro</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"><XIcon size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "model" && <div className="w-7 h-7 rounded-full bg-primary/12 flex items-center justify-center shrink-0 mt-0.5"><BotIcon size={13} className="text-primary" /></div>}
              <div className={cn("max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>{msg.text}</div>
              {msg.role === "user" && <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5"><UserIcon size={13} className="text-secondary-foreground" /></div>}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/12 flex items-center justify-center shrink-0"><BotIcon size={13} className="text-primary" /></div>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                {[0, 1, 2].map((i) => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" as const }} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {messages.length === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-2 pt-1">
            <p className="text-[11px] text-muted-foreground text-center font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_PROMPTS.map((p) => <button key={p} onClick={() => handleSend(p)} className="text-xs px-3 py-1.5 bg-accent hover:bg-primary/12 text-accent-foreground rounded-full border border-border transition-colors cursor-pointer">{p}</button>)}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2 bg-muted rounded-2xl px-3 py-2">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask your health coach..." rows={1} disabled={isLoading} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none py-1 max-h-24" style={{ minHeight: "24px" }} />
          <Button size="icon" onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 rounded-xl">
            {isLoading ? <Loader2Icon size={14} className="animate-spin" /> : <SendIcon size={14} />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">AI advice is not a substitute for medical care</p>
      </div>
    </motion.div>
  );
}
