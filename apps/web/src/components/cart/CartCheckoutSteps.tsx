"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: "CART", act: "Act I", label: "Curation" },
  { id: "UPLOAD", act: "Act II", label: "Payment" },
  { id: "SUCCESS", act: "Act III", label: "Confirmed" },
] as const;

type CartStep = (typeof STEPS)[number]["id"];

interface CartCheckoutStepsProps {
  step: CartStep;
}

export function CartCheckoutSteps({ step }: CartCheckoutStepsProps) {
  const currentIndex = STEPS.findIndex((entry) => entry.id === step);

  return (
    <ol className="flex items-center gap-2" aria-label="Checkout progress">
      {STEPS.map((entry, index) => {
        const isCurrent = entry.id === step;
        const isComplete = index < currentIndex;

        return (
          <li key={entry.id} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                isCurrent && "border-primary bg-primary text-primary-foreground shadow-coral",
                !isCurrent && isComplete && "border-primary/40 bg-brand-coral-soft text-primary",
                !isCurrent && !isComplete && "border-border bg-muted text-muted-foreground"
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0 hidden sm:block">
              <p
                className={cn(
                  "truncate text-[8px] font-semibold uppercase tracking-[0.2em]",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {entry.act}
              </p>
              <p className={cn("truncate text-[11px] font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {entry.label}
              </p>
            </div>
            {index < STEPS.length - 1 ? (
              <span
                className={cn("mx-1 hidden h-px flex-1 sm:block", isComplete ? "bg-primary/40" : "bg-border")}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export type { CartStep };
