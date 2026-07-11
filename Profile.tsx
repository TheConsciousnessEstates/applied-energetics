import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { STAGES } from "../../../shared/constants";
import { Edit2, Save, X, Smartphone, Activity } from "lucide-react";

const SPORTS = ["MMA", "BJJ", "Boxing", "Muay Thai", "Wrestling", "Judo", "Kickboxing", "Other"];
const GOALS = [
  "Pre-fight anxiety control", "Between-round recovery", "Breath endurance",
  "Flow state access", "Aggression regulation", "Pattern recognition",
  "Post-training recovery", "Sleep optimization",
];

export default function Profile() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const { data: userData, refetch } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.sessions.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: latestAssessment } = trpc.assessment.latest.useQuery(undefined, { enabled: isAuthenticated });

  const user = userData?.user;
  const profile = userData?.profile;
  const tier = user?.subscriptionTier ?? "free";
  const stage = STAGES[(user?.currentStage ?? 1) - 1];

  const [form, setForm] = useState({
    name: user?.name ?? "",
    sport: profile?.sport ?? "",
    experienceLevel: profile?.experienceLevel ?? "beginner" as const,
    trainingGoals: (profile?.trainingGoals as string[]) ?? [],
    weeklyTrainingDays: profile?.weeklyTrainingDays ?? 3,
    primaryFocus: profile?.primaryFocus ?? "",
  });

  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.user?.name ?? "",
        sport: userData.profile?.sport ?? "",
        experienceLevel: userData.profile?.experienceLevel ?? "beginner",
        trainingGoals: (userData.profile?.trainingGoals as string[]) ?? [],
        weeklyTrainingDays: userData.profile?.weeklyTrainingDays ?? 3,
        primaryFocus: userData.profile?.primaryFocus ?? "",
      });
    }
  }, [userData]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated.");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleGoal = (goal: string) => {
    setForm((f) => ({
      ...f,
      trainingGoals: f.trainingGoals.includes(goal)
        ? f.trainingGoals.filter((g) => g !== goal)
        : [...f.trainingGoals, goal],
    }));
  };

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="border-b border-border pb-8 mb-8">
          <h1 className="font-display text-5xl font-black uppercase">Profile</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left: Identity ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Athlete card */}
            <div className="brut-card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Athlete
                  </div>
                  {editing ? (
                    <input
                      className="brut-input text-2xl font-display font-black uppercase"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  ) : (
                    <h2 className="font-display text-3xl font-black uppercase">{user?.name ?? "—"}</h2>
                  )}
                  <div className="font-mono text-xs text-muted-foreground mt-1">{user?.email}</div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {editing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </button>
              </div>

              {editing ? (
                <div className="space-y-4">
                  {/* Sport */}
                  <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">Sport</label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setForm((f) => ({ ...f, sport: s }))}
                          className={`font-mono text-xs px-3 py-1.5 border ${
                            form.sport === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">Experience</label>
                    <div className="flex gap-2">
                      {(["beginner", "intermediate", "advanced", "elite"] as const).map((l) => (
                        <button
                          key={l}
                          onClick={() => setForm((f) => ({ ...f, experienceLevel: l }))}
                          className={`font-mono text-xs px-3 py-1.5 border capitalize ${
                            form.experienceLevel === l ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">Goals</label>
                    <div className="flex flex-wrap gap-2">
                      {GOALS.map((g) => (
                        <button
                          key={g}
                          onClick={() => toggleGoal(g)}
                          className={`font-mono text-xs px-3 py-1.5 border ${
                            form.trainingGoals.includes(g) ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly days */}
                  <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                      Training days/week: {form.weeklyTrainingDays}
                    </label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5,6,7].map((d) => (
                        <button
                          key={d}
                          onClick={() => setForm((f) => ({ ...f, weeklyTrainingDays: d }))}
                          className={`w-9 h-9 font-mono text-xs border ${
                            form.weeklyTrainingDays === d ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => updateProfile.mutate(form)}
                    disabled={updateProfile.isPending}
                    className="brut-btn-primary text-xs flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Sport</div>
                    <div className="font-display text-sm font-bold uppercase">{profile?.sport ?? "—"}</div>
                  </div>
                  <div>
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Experience</div>
                    <div className="font-display text-sm font-bold uppercase capitalize">{profile?.experienceLevel ?? "—"}</div>
                  </div>
                  <div>
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Training Days</div>
                    <div className="font-display text-sm font-bold uppercase">{profile?.weeklyTrainingDays ?? "—"}/week</div>
                  </div>
                  <div>
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Primary Focus</div>
                    <div className="font-display text-sm font-bold uppercase">{profile?.primaryFocus ?? "—"}</div>
                  </div>
                  {profile?.trainingGoals && (profile.trainingGoals as string[]).length > 0 && (
                    <div className="col-span-2">
                      <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Goals</div>
                      <div className="flex flex-wrap gap-2">
                        {(profile.trainingGoals as string[]).map((g) => (
                          <span key={g} className="font-mono text-xs border border-border px-2 py-1 text-muted-foreground">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Training stats */}
            <div className="brut-card">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Training Summary
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="stat-value">{stats?.totalSessions ?? 0}</div>
                  <div className="stat-label">Sessions</div>
                </div>
                <div>
                  <div className="stat-value">{stats?.totalMinutes ?? 0}</div>
                  <div className="stat-label">Minutes</div>
                </div>
                <div>
                  <div className="stat-value">{stats?.streak ?? 0}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>
            </div>

            {/* Retake assessment */}
            <div className="brut-card">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Stage Assessment
              </div>
              <p className="font-sans text-sm text-muted-foreground mb-4">
                {latestAssessment
                  ? `Last assessed: ${new Date(latestAssessment.assessmentDate).toLocaleDateString()}`
                  : "No assessment on record."}
              </p>
              <Link href="/assessment">
                <button className="brut-btn-ghost text-xs">Retake Assessment</button>
              </Link>
            </div>

            {/* Connected Devices */}
            <div className="brut-card">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Connected Devices
              </div>
              <div className="space-y-3">
                {/* Apple Health */}
                <div className="flex items-center justify-between p-3 border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-display text-sm font-bold uppercase">Apple Health</div>
                      <div className="font-mono text-xs text-muted-foreground">iOS / watchOS</div>
                    </div>
                  </div>
                  <button className="brut-btn-ghost text-xs py-1 px-2">Connect</button>
                </div>

                {/* Google Health Connect */}
                <div className="flex items-center justify-between p-3 border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-display text-sm font-bold uppercase">Google Health</div>
                      <div className="font-mono text-xs text-muted-foreground">Android</div>
                    </div>
                  </div>
                  <button className="brut-btn-ghost text-xs py-1 px-2">Connect</button>
                </div>

                {/* Samsung Health */}
                <div className="flex items-center justify-between p-3 border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-display text-sm font-bold uppercase">Samsung Health</div>
                      <div className="font-mono text-xs text-muted-foreground">Samsung Wearables</div>
                    </div>
                  </div>
                  <button className="brut-btn-ghost text-xs py-1 px-2">Connect</button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20">
                <div className="font-mono text-xs text-muted-foreground">
                  Connected devices sync heart rate, respiratory rate, HRV, and SpO2 data to your sessions for real-time biometric tracking.
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Subscription ───────────────────────────────────── */}
          <div className="space-y-6">
            {/* Current stage */}
            <div className={`brut-card ${stage.bgColor}/20`}>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Current Stage
              </div>
              <div className={`font-display text-5xl font-black uppercase ${stage.color}`}>
                {user?.currentStage ?? 1}
              </div>
              <div className={`font-display text-lg font-bold uppercase ${stage.color} mt-1`}>
                {stage.name}
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-1">{stage.bpmRange}</div>
            </div>

            {/* Subscription */}
            <div className="brut-card">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Subscription
              </div>
              <div className={`inline-flex mb-4 ${tier === "elite" ? "tier-elite" : tier === "pro" ? "tier-pro" : "tier-free"}`}>
                {tier.toUpperCase()}
              </div>
              {tier === "free" && (
                <div>
                  <p className="font-mono text-xs text-muted-foreground mb-3">
                    Upgrade to unlock all 24 protocols and session tracking.
                  </p>
                  <Link href="/pricing">
                    <button className="brut-btn-primary w-full text-xs py-3">Upgrade to Pro</button>
                  </Link>
                </div>
              )}
              {tier === "pro" && (
                <div>
                  <p className="font-mono text-xs text-muted-foreground mb-3">
                    Upgrade to Elite for personalized recommendations.
                  </p>
                  <Link href="/pricing">
                    <button className="brut-btn-gold w-full text-xs py-3">Upgrade to Elite</button>
                  </Link>
                </div>
              )}
              {tier === "elite" && (
                <p className="font-mono text-xs text-muted-foreground">
                  Maximum tier. Full access to all features.
                </p>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="brut-btn-ghost w-full text-xs py-3 text-muted-foreground"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
