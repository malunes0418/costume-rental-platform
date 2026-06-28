"use client";

import { cn } from "@/lib/utils";

const ACTS = [
  { step: 1, act: "Act I", label: "Dates per costume" },
  { step: 2, act: "Act II", label: "Delivery per vendor" },
  { step: 3, act: "Act III", label: "Pay in cart" }
] as const;

interface CartWorkflowActsProps {
  currentStep: number;
}

export function CartWorkflowActs({ currentStep }: CartWorkflowActsProps) {
  return (
    <ol className="workflow-act-track" aria-label="Checkout workflow">
      {ACTS.map(({ step, act, label }, index) => {
        const isCurrent = currentStep === step;
        const isComplete = currentStep > step;
        const isLast = index === ACTS.length - 1;

        return (
          <li
            key={step}
            className={cn(
              "workflow-act-step flex flex-1 flex-col gap-2 px-4 py-4 first:pl-0 last:pr-0 sm:px-5",
              !isLast && "workflow-act-step--connected"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums",
                  isCurrent && "border-primary bg-primary text-primary-foreground shadow-coral",
                  !isCurrent && isComplete && "border-primary/40 bg-brand-coral-soft text-primary",
                  !isCurrent && !isComplete && "border-border bg-muted text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {step}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-[0.22em]",
                    isCurrent && "text-primary",
                    !isCurrent && isComplete && "text-muted-foreground",
                    !isCurrent && !isComplete && "text-muted-foreground/60"
                  )}
                >
                  {act}
                </p>
                <p
                  className={cn(
                    "truncate text-xs font-medium",
                    isCurrent && "text-foreground",
                    !isCurrent && "text-muted-foreground"
                  )}
                >
                  {label}
                </p>
              </div>
              {isCurrent ? (
                <span className="ml-auto hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-primary sm:inline">
                  Now
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
