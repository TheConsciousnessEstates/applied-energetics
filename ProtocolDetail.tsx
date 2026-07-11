import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { CHAKRAS } from "../../../shared/constants";
import { Clock, Wind, ChevronLeft, Play, Lock } from "lucide-react";

const ELEMENT_ICONS: Record<string, string> = {
  earth: "⬛", water: "◆", fire: "▲", air: "○", ether: "✦",
};
const ELEMENT_LABELS: Record<string, string> = {
  earth: "Earth", water: "Water", fire: "Fire", air: "Air", ether: "Ether",
};

export default function ProtocolDetail({ params }: { params: { slug: string } }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const { data: protocol, isLoading, error } = trpc.protocols.get.useQuery(
    { slug: params.slug },
    { enabled: isAuthenticated }
  );
  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const tier = userData?.user?.subscriptionTier ?? "free";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container py-12">
          <div className="brut-card h-96 animate-pulse bg-secondary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !protocol) {
    return (
      <AppLayout>
        <div className="container py-12 text-center">
          {error?.data?.code === "FORBIDDEN" ? (
            <div>
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-3xl font-black uppercase mb-4">Protocol Locked</h2>
              <p className="font-mono text-muted-foreground mb-6">
                Upgrade to Pro to access this protocol.
              </p>
              <Link href="/pricing">
                <button className="brut-btn-primary">Upgrade to Pro — $9/mo</button>
              </Link>
            </div>
          ) : (
            <p className="font-mono text-muted-foreground">Protocol not found.</p>
          )}
        </div>
      </AppLayout>
    );
  }

  const chakraColors: Record<string, string> = Object.fromEntries(
    CHAKRAS.map((c) => [c.id, c.color])
  );
  const activeFocus = protocol.chakraFocus as string[];

  return (
    <AppLayout>
      <div className="container py-8">
        {/* ── Back ──────────────────────────────────────────────────────── */}
        <Link href="/protocols">
          <button className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Protocol Library
          </button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="border-b border-border pb-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`stage-badge stage-${protocol.stageRequired}`}>
                  Stage {protocol.stageRequired}
                </div>
                <span className="font-mono text-sm">{ELEMENT_ICONS[protocol.element]}</span>
                <span className="font-mono text-xs text-muted-foreground capitalize">
                  {ELEMENT_LABELS[protocol.element]}
                </span>
                <span className="font-mono text-xs text-muted-foreground capitalize">
                  {protocol.difficulty}
                </span>
              </div>
              <h1 className="font-display text-5xl font-black uppercase mb-4">{protocol.name}</h1>
              <p className="font-sans text-muted-foreground">{protocol.description}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="brut-card text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold">{protocol.durationMinutes}</div>
                <div className="font-mono text-xs text-muted-foreground uppercase">minutes</div>
              </div>
              <div className="brut-card text-center">
                <Wind className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold">{protocol.targetBreathRate}</div>
                <div className="font-mono text-xs text-muted-foreground uppercase">bpm target</div>
              </div>
              <div className="brut-card text-center">
                <div className="font-mono text-xs text-muted-foreground uppercase mb-2">Pattern</div>
                <div className="font-mono text-sm font-bold">
                  {protocol.inhaleSeconds}s in
                </div>
                {protocol.holdAfterInhaleSeconds > 0 && (
                  <div className="font-mono text-xs text-muted-foreground">
                    {protocol.holdAfterInhaleSeconds}s hold
                  </div>
                )}
                <div className="font-mono text-sm font-bold">{protocol.exhaleSeconds}s out</div>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-8">
              <h2 className="section-header">Protocol Steps</h2>
              <div className="space-y-3">
                {(protocol.steps as string[]).map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-card border border-border">
                    <span className="font-mono text-primary font-bold text-sm flex-shrink-0 w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="font-sans text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sound */}
            {protocol.chakraSoundSyllable && (
              <div className="brut-card mb-8">
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  Activation Sound
                </div>
                <div className="font-display text-4xl font-black text-primary">
                  {protocol.chakraSoundSyllable}
                </div>
                {protocol.soundFrequency && (
                  <div className="font-mono text-xs text-muted-foreground mt-1">
                    {protocol.soundFrequency} frequency
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Start session CTA */}
            <Link href={`/session/${protocol.id}`}>
              <button className="brut-btn-primary w-full py-5 text-base flex items-center justify-center gap-3">
                <Play className="w-5 h-5" />
                Begin Session
              </button>
            </Link>

            {/* 7-Point Energy Architecture */}
            <div className="brut-card">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                7-Point Energy Architecture
              </div>
              <div className="space-y-3">
                {CHAKRAS.slice().reverse().map((chakra) => {
                  const isActive = activeFocus.includes(chakra.id);
                  return (
                    <div
                      key={chakra.id}
                      className={`flex items-center gap-3 p-2 transition-colors ${
                        isActive ? "bg-card border border-border" : "opacity-30"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? "animate-pulse-ring" : ""}`}
                        style={{ backgroundColor: chakra.color }}
                      />
                      <div className="flex-1">
                        <div className="font-display text-xs font-bold uppercase" style={{ color: isActive ? chakra.color : undefined }}>
                          {chakra.name}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {chakra.sound}
                        </div>
                      </div>
                      {isActive && (
                        <span className="font-mono text-xs" style={{ color: chakra.color }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            {protocol.tags && (protocol.tags as string[]).length > 0 && (
              <div className="brut-card">
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {(protocol.tags as string[]).map((tag) => (
                    <span key={tag} className="font-mono text-xs border border-border px-2 py-1 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
