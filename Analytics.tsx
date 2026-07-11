import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Lock, Flame, Target, Clock, TrendingUp } from "lucide-react";

export default function Analytics() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const { data: stats, isLoading } = trpc.sessions.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 }, { enabled: isAuthenticated });
  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: assessments } = trpc.assessment.history.useQuery(undefined, { enabled: isAuthenticated });

  const tier = userData?.user?.subscriptionTier ?? "free";
  const analyticsLocked = stats?.analyticsLocked ?? true;

  // Build frequency data for last 30 days
  const frequencyData = (() => {
    if (!stats?.frequency) return [];
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      map[key] = 0;
    }
    for (const s of stats.frequency) {
      const key = new Date(s.startedAt).toISOString().split("T")[0];
      if (key in map) map[key]++;
    }
    return Object.entries(map).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count,
    }));
  })();

  // Build breath rate trend from sessions
  const breathTrend = (() => {
    if (!sessions) return [];
    return sessions
      .filter((s) => s.session.endingBreathRate)
      .slice(-20)
      .map((s, i) => ({
        i: i + 1,
        bpm: s.session.endingBreathRate,
        date: new Date(s.session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
  })();

  // Stage progression from assessments
  const stageProg = assessments?.map((a) => ({
    date: new Date(a.assessmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    stage: a.stage,
  })) ?? [];

  if (tier === "free") {
    return (
      <AppLayout>
        <div className="container py-12 max-w-xl">
          <div className="brut-card text-center py-16">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-3xl font-black uppercase mb-4">Analytics</h2>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              Detailed analytics require a Pro subscription.
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
        <div className="border-b border-border pb-8 mb-8">
          <h1 className="font-display text-5xl font-black uppercase">Analytics</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Performance data across all sessions
          </p>
        </div>

        {/* ── Top stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-block">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-primary" />
              <span className="stat-label">Streak</span>
            </div>
            <div className="stat-value">{stats?.streak ?? 0}</div>
            <div className="font-mono text-xs text-muted-foreground">days</div>
          </div>
          <div className="stat-block">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-value">{stats?.totalSessions ?? 0}</div>
            <div className="font-mono text-xs text-muted-foreground">sessions</div>
          </div>
          <div className="stat-block">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="stat-label">Volume</span>
            </div>
            <div className="stat-value">{stats?.totalMinutes ?? 0}</div>
            <div className="font-mono text-xs text-muted-foreground">minutes</div>
          </div>
          <div className="stat-block">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="stat-label">Avg Exertion</span>
            </div>
            <div className="stat-value font-mono text-accent">
              {stats?.avgExertion ? stats.avgExertion.toFixed(1) : "—"}
            </div>
            <div className="font-mono text-xs text-muted-foreground">/ 10</div>
          </div>
        </div>

        {/* ── Session frequency chart ────────────────────────────────────── */}
        {analyticsLocked ? (
          <div className="brut-card relative mb-8">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/80">
              <Lock className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="font-mono text-xs text-muted-foreground mb-3">Advanced analytics — Pro required</p>
              <Link href="/pricing">
                <button className="brut-btn-primary text-xs">Upgrade</button>
              </Link>
            </div>
            <div className="blur-sm pointer-events-none">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Session Frequency — Last 30 Days
              </div>
              <div className="h-48 bg-secondary" />
            </div>
          </div>
        ) : (
          <>
            {/* Frequency bar chart */}
            <div className="brut-card mb-8">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Session Frequency — Last 30 Days
              </div>
              {frequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={frequencyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      interval={6}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1A1A",
                        border: "1px solid #333",
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                        color: "#E5E5E5",
                      }}
                      cursor={{ fill: "rgba(255,51,51,0.1)" }}
                    />
                    <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                      {frequencyData.map((entry, i) => (
                        <Cell key={i} fill={entry.count > 0 ? "#FF3333" : "#222"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <p className="font-mono text-xs text-muted-foreground">No sessions in the last 30 days.</p>
                </div>
              )}
            </div>

            {/* Breath rate trend */}
            {breathTrend.length > 1 && (
              <div className="brut-card mb-8">
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                  Breath Rate Trend (ending BPM)
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={breathTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1A1A",
                        border: "1px solid #333",
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                        color: "#E5E5E5",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      stroke="#FF3333"
                      strokeWidth={2}
                      dot={{ fill: "#FF3333", r: 3 }}
                      activeDot={{ r: 5, fill: "#FFD700" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stage progression */}
            {stageProg.length > 0 && (
              <div className="brut-card mb-8">
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                  Stage Progression
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={stageProg} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[1, 4]}
                      ticks={[1, 2, 3, 4]}
                      tick={{ fill: "#888", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1A1A1A",
                        border: "1px solid #333",
                        fontFamily: "JetBrains Mono",
                        fontSize: 11,
                        color: "#E5E5E5",
                      }}
                      formatter={(v: any) => [`Stage ${v}`, "Stage"]}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="stage"
                      stroke="#FFD700"
                      strokeWidth={2}
                      dot={{ fill: "#FFD700", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* ── Elite upgrade CTA ─────────────────────────────────────────── */}
        {tier === "pro" && (
          <div className="brut-card border-accent/30 bg-accent/5 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">Elite Tier</div>
                <h3 className="font-display text-xl font-extrabold uppercase">Personalized Recommendations</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Elite unlocks AI-driven protocol recommendations and 1-on-1 consultation booking.
                </p>
              </div>
              <Link href="/pricing">
                <button className="brut-btn-gold text-xs whitespace-nowrap">
                  Upgrade to Elite — $29/mo
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
