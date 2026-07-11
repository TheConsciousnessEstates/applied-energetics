import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Lock, Clock, Wind } from "lucide-react";
import { STAGES, CHAKRAS, ELEMENTS } from "../../../shared/constants";

const ELEMENT_ICONS: Record<string, string> = {
  earth: "⬛",
  water: "◆",
  fire: "▲",
  air: "○",
  ether: "✦",
};

export default function ProtocolsGuest() {
  // Show 3 preview protocols: one from each of Stage 1, 2, 3
  const previewProtocols = [
    {
      id: 1,
      name: "Root Lock",
      stage: 1,
      chakra: "root",
      element: "earth",
      duration: 5,
      bpm: 12,
      description: "Foundation breathing for nervous system stability.",
    },
    {
      id: 2,
      name: "Solar Ignition",
      stage: 2,
      chakra: "solar",
      element: "fire",
      duration: 8,
      bpm: 15,
      description: "Power generation through core activation.",
    },
    {
      id: 3,
      name: "Crown Expansion",
      stage: 3,
      chakra: "crown",
      element: "air",
      duration: 10,
      bpm: 18,
      description: "Expanded awareness and mental clarity.",
    },
  ];

  const stageMap = STAGES.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as Record<number, any>);
  const chakraMap = CHAKRAS.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, any>);

  return (
    <AppLayout>
      <div className="container py-8">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="border-b border-border pb-8 mb-8">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
            4-Stage Breath Mastery · 7-Point Energy Architecture
          </div>
          <h1 className="font-display text-5xl font-black uppercase">Protocol Library</h1>
          <p className="font-sans text-muted-foreground mt-2">
            Preview 3 protocols. Sign in to unlock all 24.
          </p>
        </div>

        {/* ── Unlock banner ────────────────────────────────────────────── */}
        <div className="border border-primary bg-primary/5 p-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-lg font-bold uppercase text-primary mb-1">
                UNLOCK THE FULL ARSENAL
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                Sign in to access all 24 protocols, session tracking, audio cues, and analytics.
              </p>
            </div>
            <button
              onClick={() => startLogin()}
              className="bg-primary text-background font-display font-bold uppercase px-6 py-3 hover:bg-accent transition-colors flex-shrink-0"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* ── Protocol cards ────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewProtocols.map((protocol) => {
            const stage = stageMap[protocol.stage];
            const chakra = chakraMap[protocol.chakra];

            return (
              <div
                key={protocol.id}
                className="border border-border bg-card p-6 hover:border-primary/50 transition-colors group relative"
              >
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-mono text-xs text-muted-foreground mb-3">Sign in to start session</p>
                    <button
                      onClick={() => startLogin()}
                      className="bg-primary text-background font-mono text-xs font-bold uppercase px-4 py-2 hover:bg-accent transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                {/* Stage badge */}
                <div className={`inline-block font-mono text-xs font-bold uppercase px-2 py-1 mb-3 ${stage.bgColor} ${stage.color}`}>
                  Stage {stage.id}
                </div>

                {/* Title */}
                <h3 className="font-display text-xl font-black uppercase mb-2">{protocol.name}</h3>

                {/* Chakra + Element */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 bg-primary"
                  />
                  <span className="font-mono text-xs text-muted-foreground capitalize">Neural Anchor</span>
                  <span className="text-lg">{ELEMENT_ICONS[protocol.element]}</span>
                </div>

                {/* Description */}
                <p className="font-sans text-sm text-muted-foreground mb-4">{protocol.description}</p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {protocol.duration}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    {protocol.bpm} bpm
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── CTA section ───────────────────────────────────────────────── */}
        <div className="mt-12 border border-border bg-card p-8 text-center">
          <h2 className="font-display text-3xl font-black uppercase mb-3">Ready to Train?</h2>
          <p className="font-mono text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            These 3 protocols are just the beginning. Unlock the full 24-protocol system with session tracking, analytics, and health platform sync.
          </p>
          <button
            onClick={() => startLogin()}
            className="bg-primary text-background font-display font-bold uppercase px-8 py-4 hover:bg-accent transition-colors"
          >
            ENTER THE SYSTEM
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
