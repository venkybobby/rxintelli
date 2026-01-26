"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Intake", "Verification", "Entry", "Adjudication", "Schedule"] as const;

export type StepperStep = (typeof STEPS)[number];

interface StepperProps {
  current: StepperStep;
  className?: string;
}

export function Stepper({ current, className }: StepperProps) {
  const idx = STEPS.indexOf(current);
  return (
    <nav
      aria-label="Progress"
      className={cn("flex items-center justify-center gap-1 sm:gap-2", className)}
    >
      {STEPS.map((step, i) => {
        const isActive = i === idx;
        const isPast = i < idx;
        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:text-sm",
                isActive && "bg-teal-600 text-white",
                isPast && "bg-teal-100 text-teal-800",
                !isActive && !isPast && "bg-slate-100 text-slate-500"
              )}
            >
              {i + 1}. {step}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-4 sm:w-6",
                  isPast ? "bg-teal-300" : "bg-slate-200"
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
