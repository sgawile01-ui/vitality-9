import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { SparklesIcon, XIcon, CheckIcon } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function ProUpsellModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const createCheckout = useAction(api.payments.createProCheckoutSession);
  const billing = useQuery(api.billing.status);
  const [loading, setLoading] = useState(false);
  const [checkoutRequestId] = useState(() => crypto.randomUUID());

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckout({
        requestId: checkoutRequestId,
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
    <dialog
      ref={dialogRef}
      aria-labelledby="pro-title"
      onCancel={onClose}
      className="m-auto w-full max-w-md bg-transparent p-4 backdrop:bg-black/40"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border"
      >
        <div className="flex justify-end mb-2">
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
            <SparklesIcon size={28} className="text-primary" />
          </div>
        </div>
        <div className="text-center mb-5">
          <h2 id="pro-title" className="text-xl font-bold text-foreground mb-1">
            Unlock AI Coaching
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upgrade to Vitality 9 Pro to chat with your personal AI wellness coach — powered by
            Gemini and guided by the 9 Pillars of Vitality.
          </p>
        </div>
        <ul className="space-y-2 mb-6">
          {[
            "AI wellness conversations with usage limits",
            "Personalized advice for all 9 pillars",
            "General wellness education",
            "Unlimited 9-day journey resets",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckIcon size={15} className="text-primary shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          size="lg"
          onClick={handleUpgrade}
          disabled={!billing?.testOnly || loading}
        >
          {loading ? (
            "Redirecting to checkout..."
          ) : (
            <>
              <SparklesIcon size={16} />
              {billing?.testOnly ? "Try test checkout — no real charge" : "Get Pro – $4.99/mo"}
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {billing?.testOnly
            ? "Sandbox checkout. Use Stripe test payment details only."
            : "Payments are disabled during controlled testing."}
        </p>
      </motion.div>
    </dialog>
  );
}
