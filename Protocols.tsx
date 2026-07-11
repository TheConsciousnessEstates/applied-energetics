import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { STAGES, CHAKRAS, ELEMENTS } from "../../../shared/constants";
import { Lock, Filter, ChevronRight, Clock, Wind } from "lucide-react";

const ELEMENT_ICONS: Record<string, string> = {
  earth: "⬛", water: "◆", fire: "▲", air: "○", ether: "✦",
};

export default function Protocols() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const [stageFilter, setStageFilter] = useState<number | undefined>();
  const [elementFilter, setElementFilter] = useState<string | undefined>();
  const [chakraFilter, setChakraFilter] = useState<string | undefined>();

  const { data: protocols, isLoading } = trpc.protocols.list.useQuery(
    { stage: stageFilter, element: elementFilter as any, chakra: chakraFilter },
    { enabled: isAuthenticated }
  );

  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const tier = userData?.user?.subscriptionTier ?? "free";

  const accessible = protocols?.filter((p) => p.accessible) ?? [];
  const locked = protocols?.filter((p) => !p.accessible) ?? [];

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
            {protocols?.length ?? 24} protocols across 4 stages and 7 chakra centers.
          </p>
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="mb-8 space-y-4">
          {/* Stage filter */}
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Stage
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStageFilter(undefined)}
                className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                  !stageFilter ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                }`}
              >
                All
              </button>
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStageFilter(stageFilter === s.id ? undefined : s.id)}
                  className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                    stageFilter === s.id
                      ? `${s.borderColor} ${s.color} ${s.bgColor}`
                      : "border-border text-muted-foreground"
                  }`}
                >
                  S{s.id} — {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Element filter */}
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Element
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setElementFilter(undefined)}
                className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                  !elementFilter ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                }`}
              >
                All
              </button>
              {ELEMENTS.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setElementFilter(elementFilter === el.id ? undefined : el.id)}
                  className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                    elementFilter === el.id
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {ELEMENT_ICONS[el.id]} {el.name}
                </button>
              ))}
            </div>
          </div>

          {/* Chakra filter */}
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Chakra
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChakraFilter(undefined)}
                className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                  !chakraFilter ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                }`}
              >
                All
              </button>
              {CHAKRAS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChakraFilter(chakraFilter === c.id ? undefined : c.id)}
                  className={`font-mono text-xs px-3 py-1.5 border transition-colors flex items-center gap-1.5 ${
                    chakraFilter === c.id
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Protocol grid ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="brut-card h-48 animate-pulse bg-secondary" />
            ))}
          </div>
        ) : (
          <>
            {/* Accessible protocols */}
            {accessible.length > 0 && (
              <div className="mb-8">
                {tier !== "free" && (
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                    {accessible.length} protocols available
                  </div>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessible.map((protocol) => (
                    <ProtocolCard key={protocol.id} protocol={protocol} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked protocols */}
            {locked.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                    {locked.length} protocols locked — upgrade to Pro
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locked.map((protocol) => (
                    <ProtocolCard key={protocol.id} protocol={protocol} locked />
                  ))}
                </div>
              </div>
            )}

            {protocols?.length === 0 && (
              <div className="text-center py-20">
                <p className="font-mono text-muted-foreground">No protocols match your filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function ProtocolCard({ protocol, locked = false }: { protocol: any; locked?: boolean }) {
  const chakraColors: Record<string, string> = {
    root: "#CC3333", sacral: "#FF8C00", "solar-plexus": "#FFD700",
    heart: "#22C55E", throat: "#3B82F6", "third-eye": "#6366F1", crown: "#A855F7",
  };

  return (
    <Link href={locked ? "/pricing" : `/protocols/${protocol.slug}`}>
      <div className={`brut-card cursor-pointer group relative overflow-hidden ${locked ? "opacity-60" : ""}`}>
        {locked && (
          <div className="absolute top-3 right-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className={`stage-badge stage-${protocol.stageRequired}`}>
            Stage {protocol.stageRequired}
          </div>
          <span className="font-mono text-base">{ELEMENT_ICONS[protocol.element]}</span>
        </div>

        <h3 className={`font-display text-xl font-extrabold uppercase mb-2 ${locked ? "" : "group-hover:text-primary"} transition-colors`}>
          {protocol.name}
        </h3>

        <p className="font-sans text-xs text-muted-foreground mb-4 line-clamp-2">
          {protocol.description}
        </p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {protocol.durationMinutes}m
          </div>
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Wind className="w-3 h-3" /> {protocol.targetBreathRate} bpm
          </div>
          <span className="font-mono text-xs text-muted-foreground capitalize">
            {protocol.difficulty}
          </span>
        </div>

        {/* Chakra dots */}
        <div className="flex items-center gap-1.5">
          {(protocol.chakraFocus as string[]).map((c: string) => (
            <div
              key={c}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: chakraColors[c] ?? "#666" }}
              title={c.replace("-", " ")}
            />
          ))}
        </div>

        {!locked && (
          <div className="mt-3 flex items-center gap-1 text-primary font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            View Protocol <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </Link>
  );
}
