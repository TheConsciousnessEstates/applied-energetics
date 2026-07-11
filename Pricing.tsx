import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation, Link, useSearch } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Check, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    period: "forever",
    description: "3 protocols. Basic timer. No tracking. Taste the system.",
    features: [
      "3 protocols (Stage 1–3 sampler)",
      "Basic breathwork timer",
      "Stage assessment quiz",
      "Onboarding profile",
    ],
    locked: [
      "Full 24-protocol library",
      "Session tracking & history",
      "Audio cues",
      "Analytics dashboard",
      "Streak counter",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 9,
    period: "/month",
    description: "All 24 protocols. Full timer + audio cues. Session tracking. Stage assessments. Breath-rate analytics. Streak counter. Health platform sync.",
    features: [
      "All 24 protocols",
      "Full timer with audio cues",
      "Session tracking & history",
      "Stage assessments",
      "Breath-rate analytics",
      "Streak counter",
      "Session frequency charts",
      "Health platform sync (Apple, Google, Samsung)",
    ],
    locked: [
      "Personalized recommendations",
      "1-on-1 consultation booking",
      "Advanced analytics",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "elite" as const,
    name: "Elite",
    price: 29,
    period: "/month",
    description: "Everything in Pro. Personalized protocol recommendations based on your training schedule. 1-on-1 consultation booking. Advanced analytics dashboard. Priority support. Full health data correlation.",
    features: [
      "Everything in Pro",
      "Personalized protocol recommendations",
      "1-on-1 consultation booking",
      "Advanced analytics dashboard",
      "Priority support",
      "Full health data correlation",
    ],
    locked: [],
    cta: "Go Elite",
    highlight: false,
  },
] as const;

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [loadingTier, setLoadingTier] = useState<"pro" | "elite" | null>(null);

  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const tier = userData?.user?.subscriptionTier ?? "free";

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      toast.info("Redirecting to Stripe Checkout...");
      // Redirect in the same tab to maintain session continuity
      window.location.href = checkoutUrl;
    },
    onError: (e) => {
      toast.error(e.message);
      setLoadingTier(null);
    },
  });

  // Show success/cancel messages from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("upgraded") === "1") {
      toast.success("Subscription activated! Welcome to the system.");
      navigate("/pricing");
    }
    if (params.get("canceled") === "1") {
      toast.info("Checkout canceled. No charges were made.");
      navigate("/pricing");
    }
  }, [search]);

  const handleUpgrade = (tierId: "pro" | "elite") => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setLoadingTier(tierId);
    createCheckout.mutate({ tier: tierId });
  };

  return (
    <AppLayout>
      <div className="container py-12">
        <div className="text-center border-b border-border pb-12 mb-12">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Subscription Tiers
          </div>
          <h1 className="font-display text-6xl font-black uppercase mb-4">Choose Your Tier</h1>
          <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto">
            Three tiers. One system. Your breath, your armor.
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            Test card: <span className="text-foreground">4242 4242 4242 4242</span> · any future date · any CVC
          </p>
        </div>

        {/* ── Tier cards ────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-0 border border-border mb-12">
          {TIERS.map((t, i) => (
            <div
              key={t.id}
              className={`p-8 ${i < TIERS.length - 1 ? "border-r border-border" : ""} ${
                t.highlight ? "bg-primary/5" : ""
              } relative`}
            >
              {t.highlight && (
                <div className="absolute top-4 right-4 font-mono text-xs text-primary uppercase">
                  Most Popular
                </div>
              )}
              {isAuthenticated && tier === t.id && (
                <div className="absolute top-4 left-4 font-mono text-xs text-accent uppercase">
                  Current
                </div>
              )}

              <div
                className={`inline-flex mb-4 ${
                  t.id === "elite" ? "tier-elite" : t.id === "pro" ? "tier-pro" : "tier-free"
                }`}
              >
                {t.name.toUpperCase()}
              </div>

              <div className="mb-6">
                <span
                  className={`font-mono text-5xl font-bold ${
                    t.id === "elite" ? "text-accent" : t.id === "pro" ? "text-primary" : "text-foreground"
                  }`}
                >
                  ${t.price}
                </span>
                <span className="font-mono text-sm text-muted-foreground ml-1">{t.period}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-mono text-xs text-foreground">
                    <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {t.locked.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                    <Lock className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isAuthenticated && tier === t.id ? (
                <button disabled className="brut-btn-ghost w-full text-xs py-3 opacity-50 cursor-default">
                  Current Plan
                </button>
              ) : t.id === "free" ? (
                isAuthenticated ? (
                  <Link href="/dashboard">
                    <button className="brut-btn-ghost w-full text-xs py-3">Go to Dashboard</button>
                  </Link>
                ) : (
                  <button onClick={() => startLogin()} className="brut-btn-ghost w-full text-xs py-3">
                    {t.cta}
                  </button>
                )
              ) : t.id === "pro" ? (
                <button
                  onClick={() => handleUpgrade("pro")}
                  disabled={loadingTier === "pro"}
                  className="brut-btn-primary w-full text-xs py-3 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loadingTier === "pro" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                  ) : (
                    isAuthenticated ? "Upgrade to Pro" : t.cta
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade("elite")}
                  disabled={loadingTier === "elite"}
                  className="brut-btn-gold w-full text-xs py-3 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loadingTier === "elite" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                  ) : (
                    isAuthenticated ? "Upgrade to Elite" : t.cta
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Feature comparison table ───────────────────────────────────── */}
        <div className="border border-border">
          <div className="grid grid-cols-4 border-b border-border">
            <div className="p-4 font-mono text-xs text-muted-foreground uppercase tracking-widest">Feature</div>
            {["Free", "Pro", "Elite"].map((t) => (
              <div key={t} className="p-4 font-display text-sm font-extrabold uppercase text-center border-l border-border">
                {t}
              </div>
            ))}
          </div>
          {[
            { feature: "Protocol access", free: "3", pro: "24", elite: "24" },
            { feature: "Session timer", free: "Basic", pro: "Full + Audio", elite: "Full + Audio" },
            { feature: "Session tracking", free: "—", pro: "✓", elite: "✓" },
            { feature: "Analytics", free: "—", pro: "Full", elite: "Advanced" },
            { feature: "Stage assessment", free: "✓", pro: "✓", elite: "✓" },
            { feature: "Streak counter", free: "—", pro: "✓", elite: "✓" },
            { feature: "Personalized recs", free: "—", pro: "—", elite: "✓" },
            { feature: "1-on-1 consultation", free: "—", pro: "—", elite: "✓" },
          ].map((row) => (
            <div key={row.feature} className="grid grid-cols-4 border-b border-border last:border-b-0">
              <div className="p-4 font-mono text-xs text-muted-foreground">{row.feature}</div>
              {[row.free, row.pro, row.elite].map((val, i) => (
                <div
                  key={i}
                  className={`p-4 font-mono text-xs text-center border-l border-border ${
                    val === "—" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {val}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
