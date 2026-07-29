import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { motion } from "motion/react";
import { UserIcon, MailIcon, FlameIcon, StarIcon, ShieldCheckIcon, LogOutIcon, PencilIcon, CheckIcon, SparklesIcon, InfinityIcon, CreditCardIcon, ExternalLinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { NINE_PILLARS_PHILOSOPHY } from "../home/_lib/challengeData.ts";

function InfoRow({ icon: Icon, label, value, valueClass }: { icon: React.ElementType; label: string; value: string; valueClass?: string; }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
      <div className="p-2 bg-muted rounded-xl shrink-0"><Icon size={16} className="text-muted-foreground" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium truncate", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function ProfileInner() {
  const user = useQuery(api.users.getCurrentUser, {});
  const updateProfile = useMutation(api.users.updateProfile);
  const createCheckout = useAction(api.payments.createProCheckoutSession);
  const createPortal = useAction(api.payments.createBillingPortalSession);
  const { signout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("pro") === "success") {
      toast.success("Welcome to Pro! Your journey is now unlimited.");
      navigate("/profile", { replace: true });
    }
  }, [searchParams, navigate]);

  if (user === undefined) return <div className="px-5 pt-8 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>;

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    try { await updateProfile({ name: nameValue.trim() }); setEditingName(false); toast.success("Name updated!"); }
    catch { toast.error("Failed to update name"); }
  };

  const handleSignOut = async () => { await signout(); navigate("/"); };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try { const { url } = await createCheckout({ successUrl: `${window.location.origin}/?pro=success`, cancelUrl: `${window.location.origin}/profile` }); window.location.href = url; }
    catch { toast.error("Could not start checkout. Please try again."); }
    finally { setCheckoutLoading(false); }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try { const { url } = await createPortal({ returnUrl: `${window.location.origin}/profile` }); window.location.href = url; }
    catch { toast.error("Could not open billing portal. Please try again."); }
    finally { setPortalLoading(false); }
  };

  return (
    <div className="px-5 pt-8 pb-4 space-y-6">
      <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>Profile</motion.h1>
      <motion.div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center gap-3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent flex items-center justify-center"><UserIcon size={36} className="text-primary" /></div>
        {editingName ? (
          <div className="flex items-center gap-2 w-full max-w-xs">
            <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="Your name" className="text-center" onKeyDown={(e) => e.key === "Enter" && handleSaveName()} autoFocus />
            <Button size="icon" variant="ghost" onClick={handleSaveName} className="shrink-0"><CheckIcon size={16} /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{user?.name ?? "Wellness Seeker"}</h2>
            <button onClick={() => { setNameValue(user?.name ?? ""); setEditingName(true); }} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"><PencilIcon size={14} /></button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-accent px-3 py-1.5 rounded-full"><FlameIcon size={13} className="text-primary" /><span className="text-xs font-semibold text-accent-foreground">{user?.streakCount ?? 0} day streak</span></div>
          {user?.isPro && <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full"><StarIcon size={13} className="text-primary" /><span className="text-xs font-semibold text-primary">Pro</span></div>}
        </div>
      </motion.div>
      <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <InfoRow icon={MailIcon} label="Email" value={user?.email ?? "Not set"} />
        <InfoRow icon={FlameIcon} label="Current streak" value={`${user?.streakCount ?? 0} days`} />
        <InfoRow icon={ShieldCheckIcon} label="Account type" value={user?.isPro ? "Pro Member" : "Free Plan"} valueClass={user?.isPro ? "text-primary font-semibold" : undefined} />
      </motion.div>
      {!user?.isPro && (
        <motion.div className="bg-gradient-to-br from-primary/10 to-accent/50 border border-primary/15 rounded-3xl p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-1"><SparklesIcon size={18} className="text-primary" /><p className="font-bold text-foreground">Upgrade to Pro</p></div>
          <ul className="text-sm text-muted-foreground mb-4 mt-2 space-y-1">
            {["Unlimited 9-day journeys", "AI wellness coaching", "Priority support"].map((f) => <li key={f} className="flex items-center gap-2"><CheckIcon size={13} className="text-primary shrink-0" />{f}</li>)}
          </ul>
          <Button className="w-full" onClick={handleUpgrade} disabled={checkoutLoading}>{checkoutLoading ? "Redirecting..." : <><SparklesIcon size={15} />Get Pro – $4.99/mo</>}</Button>
          <p className="text-center text-xs text-muted-foreground mt-2">Cancel anytime · Secure checkout via Stripe</p>
        </motion.div>
      )}
      {user?.isPro && (
        <motion.div className="bg-gradient-to-br from-primary/10 to-accent/50 border border-primary/15 rounded-3xl p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-2"><StarIcon size={18} className="text-primary" /><p className="font-bold text-foreground">Pro Member</p></div>
          <p className="text-sm text-muted-foreground mb-4">You have full access to all 9-day journeys and AI coaching.</p>
          <Button variant="secondary" className="w-full" onClick={handleManageBilling} disabled={portalLoading}>{portalLoading ? "Opening portal..." : <><CreditCardIcon size={15} />Manage Billing<ExternalLinkIcon size={13} className="ml-auto opacity-50" /></>}</Button>
        </motion.div>
      )}
      <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="flex items-center gap-2"><InfinityIcon size={16} className="text-primary" /><h3 className="text-sm font-bold uppercase tracking-wide text-foreground">The 9 Pillars of Vitality</h3></div>
        <div className="bg-gradient-to-br from-primary/10 via-accent/40 to-card border border-primary/15 rounded-3xl p-5 space-y-3">
          <p className="text-base font-bold text-foreground">{NINE_PILLARS_PHILOSOPHY.headline}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{NINE_PILLARS_PHILOSOPHY.intro}</p>
          <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/40 pl-3">{NINE_PILLARS_PHILOSOPHY.meaning}</p>
        </div>
        <div className="space-y-2">
          {NINE_PILLARS_PHILOSOPHY.pillars.map((p, i) => (
            <motion.div key={p.number} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }} className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-sm font-bold text-primary">{p.number}</span></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-foreground">{p.theme}</span><span className="text-base">{p.icon}</span></div><p className="text-xs text-muted-foreground italic truncate">{p.pillar}</p></div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive" onClick={handleSignOut}><LogOutIcon size={16} />Sign Out</Button>
      </motion.div>
    </div>
  );
}

export default function Profile() {
  return (
    <>
      <AuthLoading><div className="px-5 pt-8 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div></AuthLoading>
      <Unauthenticated><div className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-4"><UserIcon size={40} className="text-primary" /><p className="text-muted-foreground">Sign in to view your profile</p><SignInButton /></div></Unauthenticated>
      <Authenticated><ProfileInner /></Authenticated>
    </>
  );
}
