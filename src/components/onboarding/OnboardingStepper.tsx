import { Check } from "lucide-react";

interface OnboardingStepperProps {
  steps: { key: string; label: string }[];
  /** Zero-based index of the step being shown. */
  currentIndex: number;
}

/**
 * Progress header for the onboarding flow.
 *
 * Distinguishes three states rather than two: done (check), current
 * (highlighted, ring) and upcoming (muted). The previous version filled every
 * step up to the current one identically, so there was no way to tell where
 * you were versus what you had already finished.
 */
const OnboardingStepper = ({ steps, currentIndex }: OnboardingStepperProps) => {
  const total = steps.length;
  const safeIndex = Math.min(Math.max(currentIndex, 0), total - 1);

  return (
    <nav aria-label="Onboarding progress" className="w-full max-w-md">
      {/* Compact progress for small screens, where per-step labels don't fit. */}
      <p className="mb-3 text-center text-xs font-medium text-muted-foreground sm:hidden">
        Step {safeIndex + 1} of {total} · {steps[safeIndex]?.label}
      </p>

      <ol className="flex items-center justify-center gap-0">
        {steps.map((step, i) => {
          const done = i < safeIndex;
          const current = i === safeIndex;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                <span
                  aria-current={current ? "step" : undefined}
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    done && "bg-gold/20 text-gold",
                    current && "bg-gradient-gold text-white ring-4 ring-gold/20",
                    !done && !current && "bg-muted text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  <span className="sr-only">
                    {done ? "completed" : current ? "current step" : "not started"}
                  </span>
                </span>

                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    current ? "text-gold" : done ? "text-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < total - 1 && (
                <div
                  aria-hidden
                  className={`mx-2 h-px w-6 rounded-full transition-colors sm:w-10 ${
                    i < safeIndex ? "bg-gold" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default OnboardingStepper;
