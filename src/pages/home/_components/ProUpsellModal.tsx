import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { SparklesIcon, XIcon, CheckIcon } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { toast } from "sonner";

export default function ProUpsellModal({ onClose }: { onClose: () => void }) {
  const createCheckout = useAction(api.payments.createProCheckoutSession);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckout({
        successUrl: `${window.location.origin}/?pro=success`,
        cancelUrl: `${window.location.origin}/`,
      });
      window.location.href = url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", damping: 24, stiffness: 280 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"><XIcon size={16} /></button>
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center"><SparklesIcon size={28} className="text-primary" /></div>
        </div>
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-foreground mb-1">Unlock AI Coaching</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Upgrade to Vitality 9 Pro to chat with your personal AI health coach — powered by Gemini and trained on the 9 Pillars of Vitality.</p>
        </div>
        <ul className="space-y-2 mb-6">
          {["Unlimited AI health coaching conversations", "Personalized advice for all 9 pillars", "Evidence-based guidance from a medical AI", "Unlimited 9-day journey resets"].map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground"><CheckIcon size={15} className="text-primary shrink-0 mt-0.5" />{f}</li>
          ))}
        </ul>
        <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={loading}>
          {loading ? "Redirecting to checkout..." : <><SparklesIcon size={16} />Get Pro – $4.99/mo</>}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">Cancel anytime · Secure checkout via Stripe</p>
      </motion.div>
    </motion.div>
  );
}
