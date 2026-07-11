import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ASSESSMENT_QUESTIONS, STAGES } from "../../../shared/constants";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Assessment() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ stage: number; recommendedProtocols: number[] } | null>(null);

  const submitAssessment = trpc.assessment.submit.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (e) => toast.error(e.message),
  });

  const question = ASSESSMENT_QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / ASSESSMENT_QUESTIONS.length) * 100;
  const allAnswered = ASSESSMENT_QUESTIONS.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (value: number) => {
    setAnswers((a) => ({ ...a, [question.id]: value }));
    if (currentQ < ASSESSMENT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 250);
    }
  };

  if (result) {
    const stage = STAGES[result.stage - 1];
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full animate-slide-up">
          <div className="brut-card p-8 text-center">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Assessment Complete
            </div>
            <div className={`font-display text-7xl font-black uppercase ${stage.color} mb-2`}>
              Stage {result.stage}
            </div>
            <div className={`font-display text-2xl font-extrabold uppercase ${stage.color} mb-4`}>
              {stage.name}
            </div>
            <div className="font-mono text-sm text-muted-foreground mb-2">{stage.bpmRange}</div>
            <p className="font-sans text-muted-foreground mb-8">{stage.description}</p>

            <div className="border-t border-border pt-6 mb-8">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Your Starting Protocols
              </div>
              <p className="font-sans text-sm text-muted-foreground">
                {result.recommendedProtocols.length} protocols have been selected for your current stage.
                Begin with these before progressing.
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("assessmentCompleted", "true");
                navigate("/dashboard");
              }}
              className="brut-btn-primary w-full py-4"
            >
              Enter the System
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container py-16 max-w-2xl flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-12">
          <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">
            Stage Assessment
          </div>
          <h1 className="font-display text-3xl font-black uppercase">
            4-Stage Breath Mastery Diagnostic
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            Question {currentQ + 1} of {ASSESSMENT_QUESTIONS.length}
          </p>
        </div>

        {/* Question */}
        <div className="flex-1">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold uppercase mb-8 leading-tight">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full text-left brut-btn py-4 px-5 flex items-center gap-4 ${
                  answers[question.id] === option.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-mono text-xs w-6 flex-shrink-0 text-muted-foreground">
                  0{option.value}
                </span>
                <span className="font-sans text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
          <button
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="brut-btn-ghost text-xs disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {currentQ < ASSESSMENT_QUESTIONS.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              disabled={answers[question.id] === undefined}
              className="brut-btn-primary text-xs disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => submitAssessment.mutate({ answers })}
              disabled={!allAnswered || submitAssessment.isPending}
              className="brut-btn-primary text-xs disabled:opacity-40"
            >
              {submitAssessment.isPending ? "Processing..." : "Get My Stage"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
