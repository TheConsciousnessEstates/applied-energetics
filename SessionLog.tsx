import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { Plus, Clock, Zap, FileText, X } from "lucide-react";

export default function SessionLog() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const { data: sessions, isLoading, refetch } = trpc.sessions.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );
  const { data: protocols } = trpc.protocols.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const tier = userData?.user?.subscriptionTier ?? "free";

  const completeSession = trpc.sessions.complete.useMutation({
    onSuccess: () => {
      toast.success("Session logged.");
      setShowForm(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    protocolId: 0,
    durationSeconds: 0,
    perceivedExertion: 5,
    notes: "",
    chakraActivation: 4,
    startingBreathRate: "",
    endingBreathRate: "",
  });

  const accessibleProtocols = protocols?.filter((p) => p.accessible) ?? [];

  // Free tier: no tracking
  if (tier === "free") {
    return (
      <AppLayout>
        <div className="container py-12 max-w-xl">
          <div className="brut-card text-center py-16">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Feature Locked
            </div>
            <h2 className="font-display text-3xl font-black uppercase mb-4">Session Tracking</h2>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              Session logging and history requires a Pro subscription.
            </p>
            <Link href="/pricing">
              <button className="brut-btn-primary">Upgrade to Pro — $9/mo</button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-8">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border pb-8 mb-8">
          <div>
            <h1 className="font-display text-5xl font-black uppercase">Session Log</h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {sessions?.length ?? 0} sessions recorded
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="brut-btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Session
          </button>
        </div>

        {/* ── Log form modal ────────────────────────────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
            <div className="brut-card w-full max-w-lg animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-black uppercase">Log Session</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Protocol */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                    Protocol Used *
                  </label>
                  <select
                    className="brut-input"
                    value={form.protocolId}
                    onChange={(e) => setForm((f) => ({ ...f, protocolId: Number(e.target.value) }))}
                  >
                    <option value={0}>Select protocol...</option>
                    {accessibleProtocols.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stage {p.stageRequired})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="brut-input"
                    placeholder="e.g. 10"
                    value={form.durationSeconds ? form.durationSeconds / 60 : ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, durationSeconds: Number(e.target.value) * 60 }))
                    }
                  />
                </div>

                {/* Perceived exertion */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                    Perceived Exertion: <span className="text-primary">{form.perceivedExertion}/10</span> *
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    className="w-full accent-red-500"
                    value={form.perceivedExertion}
                    onChange={(e) => setForm((f) => ({ ...f, perceivedExertion: Number(e.target.value) }))}
                  />
                  <div className="flex justify-between font-mono text-xs text-muted-foreground mt-1">
                    <span>1 — Easy</span>
                    <span>10 — Maximum</span>
                  </div>
                </div>

                {/* Breath rates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                      Starting BPM
                    </label>
                    <input
                      type="number"
                      className="brut-input"
                      placeholder="e.g. 16"
                      value={form.startingBreathRate}
                      onChange={(e) => setForm((f) => ({ ...f, startingBreathRate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                      Ending BPM
                    </label>
                    <input
                      type="number"
                      className="brut-input"
                      placeholder="e.g. 6"
                      value={form.endingBreathRate}
                      onChange={(e) => setForm((f) => ({ ...f, endingBreathRate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Chakra activation */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                    Chakra Activation: <span className="text-primary">{form.chakraActivation}/7</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    className="w-full accent-purple-500"
                    value={form.chakraActivation}
                    onChange={(e) => setForm((f) => ({ ...f, chakraActivation: Number(e.target.value) }))}
                  />
                  <div className="flex justify-between font-mono text-xs text-muted-foreground mt-1">
                    <span>1 — Root</span>
                    <span>7 — Crown</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                    Post-Session Notes *
                  </label>
                  <textarea
                    className="brut-input min-h-[80px] resize-none"
                    placeholder="What did you notice? Any breakthroughs or blocks?"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <button
                  disabled={
                    !form.protocolId ||
                    !form.durationSeconds ||
                    !form.notes ||
                    completeSession.isPending
                  }
                  onClick={() =>
                    completeSession.mutate({
                      protocolId: form.protocolId,
                      durationSeconds: form.durationSeconds,
                      perceivedExertion: form.perceivedExertion,
                      notes: form.notes,
                      chakraActivation: form.chakraActivation,
                      startingBreathRate: form.startingBreathRate ? Number(form.startingBreathRate) : undefined,
                      endingBreathRate: form.endingBreathRate ? Number(form.endingBreathRate) : undefined,
                    })
                  }
                  className="brut-btn-primary w-full py-4 disabled:opacity-40"
                >
                  {completeSession.isPending ? "Saving..." : "Save Session"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Session history ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="brut-card h-20 animate-pulse bg-secondary" />
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map(({ session, protocol }) => (
              <div key={session.id} className="brut-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-lg font-extrabold uppercase">
                        {protocol?.name ?? "Unknown Protocol"}
                      </h3>
                      {protocol && (
                        <div className={`stage-badge stage-${protocol.stageRequired}`}>
                          S{protocol.stageRequired}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    {session.notes && (
                      <p className="font-sans text-xs text-muted-foreground mt-2 line-clamp-1">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 font-mono text-sm text-foreground">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {Math.floor(session.durationSeconds / 60)}m
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">duration</div>
                    </div>
                    {session.perceivedExertion && (
                      <div className="text-center">
                        <div className="font-mono text-sm text-primary font-bold">
                          {session.perceivedExertion}/10
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">exertion</div>
                      </div>
                    )}
                    {session.chakraActivation && (
                      <div className="text-center">
                        <div className="font-mono text-sm text-purple-400 font-bold">
                          {session.chakraActivation}/7
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">chakra</div>
                      </div>
                    )}
                    {session.endingBreathRate && (
                      <div className="text-center">
                        <div className="font-mono text-sm text-foreground">
                          {session.endingBreathRate}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">end bpm</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-2xl font-black uppercase mb-2">No Sessions Yet</h3>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              Log your first session to start tracking progress.
            </p>
            <button onClick={() => setShowForm(true)} className="brut-btn-primary text-xs">
              Log First Session
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
