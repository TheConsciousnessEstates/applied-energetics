import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import { CHAKRAS } from "../../../shared/constants";
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, ChevronLeft } from "lucide-react";

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out" | "done";

interface SessionState {
  phase: Phase;
  phaseTimeLeft: number;
  rep: number;
  totalReps: number;
  elapsed: number;
  running: boolean;
  completed: boolean;
}

// Synthesize a simple tone using Web Audio API
function playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export default function SessionPlayer({ params }: { params: { protocolId: string } }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const protocolId = Number(params.protocolId);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const { data: protocol, isLoading } = trpc.protocols.getById.useQuery(
    { id: protocolId },
    { enabled: isAuthenticated && !!protocolId }
  );
  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const tier = userData?.user?.subscriptionTier ?? "free";

  const completeSession = trpc.sessions.complete.useMutation({
    onSuccess: () => {
      toast.success("Session saved to your log.");
    },
    onError: (e) => toast.error(e.message),
  });

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playPhaseSound = useCallback((phase: Phase) => {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (phase === "inhale") playTone(ctx, 528, 0.3, "sine");
      else if (phase === "hold-in") playTone(ctx, 741, 0.2, "triangle");
      else if (phase === "exhale") playTone(ctx, 396, 0.4, "sine");
      else if (phase === "hold-out") playTone(ctx, 285, 0.2, "triangle");
      else if (phase === "done") {
        playTone(ctx, 528, 0.5, "sine");
        setTimeout(() => playTone(ctx, 639, 0.5, "sine"), 300);
        setTimeout(() => playTone(ctx, 741, 0.8, "sine"), 600);
      }
    } catch {}
  }, [audioEnabled]);

  // Timer state
  const [state, setState] = useState<SessionState>({
    phase: "inhale",
    phaseTimeLeft: 0,
    rep: 1,
    totalReps: 0,
    elapsed: 0,
    running: false,
    completed: false,
  });

  // Post-session form
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({
    perceivedExertion: 5,
    notes: "",
    chakraActivation: 4,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedAtPauseRef = useRef<number>(0);

  // Build phase sequence from protocol
  const buildPhaseSequence = useCallback(() => {
    if (!protocol) return [];
    const seq: { phase: Phase; duration: number }[] = [];
    seq.push({ phase: "inhale", duration: protocol.inhaleSeconds });
    if (protocol.holdAfterInhaleSeconds > 0) seq.push({ phase: "hold-in", duration: protocol.holdAfterInhaleSeconds });
    seq.push({ phase: "exhale", duration: protocol.exhaleSeconds });
    if (protocol.holdAfterExhaleSeconds > 0) seq.push({ phase: "hold-out", duration: protocol.holdAfterExhaleSeconds });
    return seq;
  }, [protocol]);

  const phaseSeqRef = useRef<{ phase: Phase; duration: number }[]>([]);
  const phaseIdxRef = useRef(0);
  const repRef = useRef(1);
  const totalRepsRef = useRef(0);

  const totalReps = protocol
    ? Math.floor((protocol.durationMinutes * 60) /
        (protocol.inhaleSeconds +
          (protocol.holdAfterInhaleSeconds ?? 0) +
          protocol.exhaleSeconds +
          (protocol.holdAfterExhaleSeconds ?? 0)))
    : 0;

  const initSession = useCallback(() => {
    if (!protocol) return;
    const seq = buildPhaseSequence();
    phaseSeqRef.current = seq;
    phaseIdxRef.current = 0;
    repRef.current = 1;
    totalRepsRef.current = totalReps;
    setState({
      phase: seq[0]?.phase ?? "inhale",
      phaseTimeLeft: seq[0]?.duration ?? 0,
      rep: 1,
      totalReps,
      elapsed: 0,
      running: false,
      completed: false,
    });
  }, [protocol, buildPhaseSequence, totalReps]);

  useEffect(() => {
    if (protocol) initSession();
  }, [protocol, initSession]);

  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.running || prev.completed) return prev;
      const newElapsed = prev.elapsed + 1;
      const newPhaseLeft = prev.phaseTimeLeft - 1;

      if (newPhaseLeft <= 0) {
        // Advance to next phase
        const seq = phaseSeqRef.current;
        let nextIdx = phaseIdxRef.current + 1;
        let nextRep = repRef.current;

        if (nextIdx >= seq.length) {
          // Completed one rep
          nextIdx = 0;
          nextRep = repRef.current + 1;
          repRef.current = nextRep;
        }
        phaseIdxRef.current = nextIdx;

        // Check if session complete
        if (nextRep > totalRepsRef.current && totalRepsRef.current > 0) {
          playPhaseSound("done");
          return { ...prev, elapsed: newElapsed, phaseTimeLeft: 0, running: false, completed: true };
        }

        const nextPhase = seq[nextIdx];
        if (nextPhase) playPhaseSound(nextPhase.phase);

        return {
          ...prev,
          phase: nextPhase?.phase ?? "done",
          phaseTimeLeft: nextPhase?.duration ?? 0,
          rep: nextRep,
          elapsed: newElapsed,
        };
      }

      return { ...prev, phaseTimeLeft: newPhaseLeft, elapsed: newElapsed };
    });
  }, [playPhaseSound]);

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running, tick]);

  const handleStart = () => {
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    const seq = phaseSeqRef.current;
    if (seq[phaseIdxRef.current]) playPhaseSound(seq[phaseIdxRef.current].phase);
    setState((s) => ({ ...s, running: true }));
  };

  const handlePause = () => setState((s) => ({ ...s, running: false }));

  const handleReset = () => {
    setState((s) => ({ ...s, running: false }));
    initSession();
  };

  const handleFinishEarly = () => {
    setState((s) => ({ ...s, running: false, completed: true }));
  };

  const handleSaveSession = () => {
    if (!protocol) return;
    completeSession.mutate({
      protocolId: protocol.id,
      durationSeconds: state.elapsed,
      perceivedExertion: postForm.perceivedExertion,
      notes: postForm.notes,
      chakraActivation: postForm.chakraActivation,
    });
    setShowPostForm(false);
    navigate("/log");
  };

  // Phase colors and labels
  const PHASE_CONFIG: Record<Phase, { label: string; color: string; bg: string }> = {
    inhale: { label: "INHALE", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    "hold-in": { label: "HOLD", color: "#FFD700", bg: "rgba(255,215,0,0.1)" },
    exhale: { label: "EXHALE", color: "#FF3333", bg: "rgba(255,51,51,0.1)" },
    "hold-out": { label: "HOLD", color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
    done: { label: "COMPLETE", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  };

  const phaseConfig = PHASE_CONFIG[state.phase];
  const cycleLen = protocol
    ? protocol.inhaleSeconds +
      (protocol.holdAfterInhaleSeconds ?? 0) +
      protocol.exhaleSeconds +
      (protocol.holdAfterExhaleSeconds ?? 0)
    : 1;
  const totalDuration = protocol ? protocol.durationMinutes * 60 : 1;
  const overallProgress = Math.min((state.elapsed / totalDuration) * 100, 100);
  const phaseProgress = protocol
    ? ((phaseSeqRef.current[phaseIdxRef.current]?.duration ?? 1) - state.phaseTimeLeft) /
      (phaseSeqRef.current[phaseIdxRef.current]?.duration ?? 1)
    : 0;

  const activeFocus = (protocol?.chakraFocus as string[] | undefined) ?? [];
  const chakraColors: Record<string, string> = Object.fromEntries(CHAKRAS.map((c) => [c.id, c.color]));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-muted-foreground animate-pulse">Loading protocol...</div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-muted-foreground mb-4">Protocol not found.</p>
          <Link href="/protocols">
            <button className="brut-btn-ghost text-xs">Back to Library</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ background: phaseConfig.bg }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <Link href={`/protocols/${protocol.slug}`}>
            <button className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> {protocol.name}
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {state.running && (
              <button
                onClick={handleFinishEarly}
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" /> End Early
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {state.completed ? (
          /* ── Completion screen ─────────────────────────────────────── */
          <div className="text-center animate-slide-up max-w-md w-full">
            <div className="font-mono text-xs text-green-400 uppercase tracking-widest mb-4">
              Session Complete
            </div>
            <h2 className="font-display text-6xl font-black uppercase text-green-400 mb-2">
              DONE
            </h2>
            <div className="font-mono text-sm text-muted-foreground mb-8">
              {Math.floor(state.elapsed / 60)}m {state.elapsed % 60}s · {state.rep - 1} reps completed
            </div>

            {/* Chakra activation display */}
            <div className="flex justify-center gap-2 mb-8">
              {CHAKRAS.map((c) => (
                <div
                  key={c.id}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeFocus.includes(c.id) ? "opacity-100 scale-125" : "opacity-20"
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>

            {tier !== "free" ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowPostForm(true)}
                  className="brut-btn-primary w-full py-4"
                >
                  Log This Session
                </button>
                <Link href="/protocols">
                  <button className="brut-btn-ghost w-full text-xs py-3">Back to Library</button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-mono text-xs text-muted-foreground mb-2">
                  Upgrade to Pro to save your session data.
                </p>
                <Link href="/pricing">
                  <button className="brut-btn-primary w-full py-4">Upgrade to Pro</button>
                </Link>
                <Link href="/protocols">
                  <button className="brut-btn-ghost w-full text-xs py-3">Back to Library</button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* ── Active session ────────────────────────────────────────── */
          <div className="w-full max-w-lg flex flex-col items-center gap-8">
            {/* Protocol name */}
            <div className="text-center">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">
                {protocol.name}
              </div>
              <div className={`stage-badge stage-${protocol.stageRequired}`}>
                Stage {protocol.stageRequired}
              </div>
            </div>

            {/* ── Phase ring ──────────────────────────────────────────── */}
            <div className="relative w-64 h-64">
              {/* SVG ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                {/* Background ring */}
                <circle cx="100" cy="100" r="88" fill="none" stroke="#222" strokeWidth="8" />
                {/* Progress ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke={phaseConfig.color}
                  strokeWidth="8"
                  strokeLinecap="butt"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - phaseProgress)}`}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
                />
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className="font-display text-4xl font-black uppercase tracking-widest transition-colors duration-300"
                  style={{ color: phaseConfig.color }}
                >
                  {phaseConfig.label}
                </div>
                <div className="font-mono text-6xl font-bold mt-1" style={{ color: phaseConfig.color }}>
                  {state.phaseTimeLeft}
                </div>
                <div className="font-mono text-xs text-muted-foreground mt-1">seconds</div>
              </div>
            </div>

            {/* Rep counter */}
            <div className="text-center">
              <div className="font-mono text-sm text-muted-foreground">
                Rep <span className="text-foreground font-bold">{state.rep}</span> of{" "}
                <span className="text-foreground font-bold">{state.totalReps}</span>
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-1">
                {Math.floor(state.elapsed / 60)}:{String(state.elapsed % 60).padStart(2, "0")} elapsed
              </div>
            </div>

            {/* Phase indicators */}
            <div className="flex items-center gap-2">
              {phaseSeqRef.current.map((p, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === phaseIdxRef.current ? "w-8" : "w-3"
                  }`}
                  style={{
                    backgroundColor:
                      i === phaseIdxRef.current ? PHASE_CONFIG[p.phase].color : "#333",
                  }}
                />
              ))}
            </div>

            {/* Overall progress bar */}
            <div className="w-full">
              <div className="brut-progress">
                <div
                  className="brut-progress-fill transition-all duration-1000"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-xs text-muted-foreground">0:00</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {protocol.durationMinutes}:00
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="w-12 h-12 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={state.running ? handlePause : handleStart}
                className="w-20 h-20 border-2 flex items-center justify-center transition-all active:scale-95"
                style={{
                  borderColor: phaseConfig.color,
                  color: phaseConfig.color,
                  background: `${phaseConfig.color}15`,
                }}
              >
                {state.running ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              <div className="w-12 h-12 border border-border flex flex-col items-center justify-center">
                <span className="font-mono text-xs text-muted-foreground leading-none">
                  {protocol.targetBreathRate}
                </span>
                <span className="font-mono text-xs text-muted-foreground leading-none">bpm</span>
              </div>
            </div>

            {/* Chakra focus dots */}
            <div className="flex items-center gap-2">
              {CHAKRAS.map((c) => (
                <div
                  key={c.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    activeFocus.includes(c.id) ? "opacity-100" : "opacity-15"
                  } ${state.running && activeFocus.includes(c.id) ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Breath pattern reminder */}
            <div className="font-mono text-xs text-muted-foreground text-center">
              {protocol.inhaleSeconds}s inhale
              {protocol.holdAfterInhaleSeconds > 0 && ` · ${protocol.holdAfterInhaleSeconds}s hold`}
              {` · ${protocol.exhaleSeconds}s exhale`}
              {protocol.holdAfterExhaleSeconds > 0 && ` · ${protocol.holdAfterExhaleSeconds}s hold`}
            </div>
          </div>
        )}
      </main>

      {/* ── Post-session form modal ────────────────────────────────────────── */}
      {showPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div className="brut-card w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-black uppercase">Log Session</h2>
              <button onClick={() => setShowPostForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                  Perceived Exertion: <span className="text-primary">{postForm.perceivedExertion}/10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  className="w-full accent-red-500"
                  value={postForm.perceivedExertion}
                  onChange={(e) => setPostForm((f) => ({ ...f, perceivedExertion: Number(e.target.value) }))}
                />
                <div className="flex justify-between font-mono text-xs text-muted-foreground mt-1">
                  <span>1 — Easy</span>
                  <span>10 — Maximum</span>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                  Chakra Activation: <span className="text-primary">{postForm.chakraActivation}/7</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={7}
                  className="w-full accent-purple-500"
                  value={postForm.chakraActivation}
                  onChange={(e) => setPostForm((f) => ({ ...f, chakraActivation: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                  Post-Session Notes *
                </label>
                <textarea
                  className="brut-input min-h-[80px] resize-none"
                  placeholder="What did you notice? Any breakthroughs or blocks?"
                  value={postForm.notes}
                  onChange={(e) => setPostForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <button
                disabled={!postForm.notes || completeSession.isPending}
                onClick={handleSaveSession}
                className="brut-btn-primary w-full py-4 disabled:opacity-40"
              >
                {completeSession.isPending ? "Saving..." : "Save Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
