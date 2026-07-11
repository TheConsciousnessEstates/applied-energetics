import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

const SPORTS = ["MMA", "BJJ", "Boxing", "Muay Thai", "Wrestling", "Judo", "Kickboxing", "Other"];
const GOALS = [
  "Pre-fight anxiety control",
  "Between-round recovery",
  "Breath endurance",
  "Flow state access",
  "Aggression regulation",
  "Pattern recognition",
  "Post-training recovery",
  "Sleep optimization",
];
const FOCUS_OPTIONS = [
  "Fear suppression",
  "Rhythm & consistency",
  "Explosive output",
  "Endurance",
  "Mental clarity",
  "Recovery speed",
];

export default function Onboarding() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    sport: "",
    experienceLevel: "" as "beginner" | "intermediate" | "advanced" | "elite",
    trainingGoals: [] as string[],
    weeklyTrainingDays: 3,
    primaryFocus: "",
  });

  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => navigate("/assessment"),
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

  const steps = [
    // Step 0: Sport
    <div key="sport" className="animate-slide-up">
      <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">Step 1 of 4</div>
      <h2 className="font-display text-4xl font-black uppercase mb-8">What's your sport?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            onClick={() => setForm((f) => ({ ...f, sport }))}
            className={`brut-btn text-xs py-4 ${
              form.sport === sport ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground"
            }`}
          >
            {sport}
          </button>
        ))}
      </div>
      <button
        disabled={!form.sport}
        onClick={() => setStep(1)}
        className="brut-btn-primary mt-8 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>,

    // Step 1: Experience
    <div key="exp" className="animate-slide-up">
      <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">Step 2 of 4</div>
      <h2 className="font-display text-4xl font-black uppercase mb-8">Experience level?</h2>
      <div className="grid grid-cols-2 gap-2">
        {(["beginner", "intermediate", "advanced", "elite"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setForm((f) => ({ ...f, experienceLevel: level }))}
            className={`brut-btn text-sm py-6 flex-col gap-1 ${
              form.experienceLevel === level
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground"
            }`}
          >
            <span className="font-display text-base uppercase">{level}</span>
            <span className="font-mono text-xs opacity-70">
              {level === "beginner" && "< 1 year"}
              {level === "intermediate" && "1–3 years"}
              {level === "advanced" && "3–7 years"}
              {level === "elite" && "7+ years / competitive"}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={() => setStep(0)} className="brut-btn-ghost text-xs">Back</button>
        <button
          disabled={!form.experienceLevel}
          onClick={() => setStep(2)}
          className="brut-btn-primary disabled:opacity-40"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>,

    // Step 2: Goals
    <div key="goals" className="animate-slide-up">
      <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">Step 3 of 4</div>
      <h2 className="font-display text-4xl font-black uppercase mb-2">Training goals</h2>
      <p className="font-mono text-xs text-muted-foreground mb-8">Select all that apply</p>
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((goal) => (
          <button
            key={goal}
            onClick={() => toggleGoal(goal)}
            className={`brut-btn text-xs py-3 text-left ${
              form.trainingGoals.includes(goal)
                ? "bg-primary/10 text-primary border-primary"
                : "bg-card text-muted-foreground"
            }`}
          >
            {form.trainingGoals.includes(goal) && <span className="text-primary mr-1">+</span>}
            {goal}
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={() => setStep(1)} className="brut-btn-ghost text-xs">Back</button>
        <button
          disabled={form.trainingGoals.length === 0}
          onClick={() => setStep(3)}
          className="brut-btn-primary disabled:opacity-40"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>,

    // Step 3: Weekly days + primary focus
    <div key="schedule" className="animate-slide-up">
      <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">Step 4 of 4</div>
      <h2 className="font-display text-4xl font-black uppercase mb-8">Training schedule</h2>

      <div className="mb-8">
        <div className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-4">
          Training days per week
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              onClick={() => setForm((f) => ({ ...f, weeklyTrainingDays: d }))}
              className={`w-10 h-10 font-mono text-sm border ${
                form.weeklyTrainingDays === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-4">
          Primary focus
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_OPTIONS.map((focus) => (
            <button
              key={focus}
              onClick={() => setForm((f) => ({ ...f, primaryFocus: focus }))}
              className={`brut-btn text-xs py-3 ${
                form.primaryFocus === focus
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {focus}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="brut-btn-ghost text-xs">Back</button>
        <button
          disabled={!form.primaryFocus || completeOnboarding.isPending}
          onClick={() => completeOnboarding.mutate(form)}
          className="brut-btn-primary disabled:opacity-40"
        >
          {completeOnboarding.isPending ? "Saving..." : "Complete Profile"}
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
        />
      </div>

      <div className="container py-16 max-w-2xl">
        <div className="mb-12">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Athlete Profile Setup
          </div>
          <div className="font-display text-xs text-muted-foreground">
            This data shapes your protocol recommendations and stage assessment.
          </div>
        </div>
        {steps[step]}
      </div>
    </div>
  );
}
