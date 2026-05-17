"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getMySubscription, subscribeToPlan, type Subscription } from "@/lib/vendor";

const PLAN_FEATURES = [
  "0% commission on all rentals",
  "Unlimited costume listings",
  "Priority placement in search results",
  "Direct messaging with renters",
  "Advanced analytics dashboard",
  "Dedicated vendor support",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SubscriptionMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FeatureList({
  features,
  accent = "default",
}: {
  features: string[];
  accent?: "default" | "active";
}) {
  const ringClass =
    accent === "active"
      ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
      : "border-border text-foreground";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {features.map((feature) => (
        <div
          key={feature}
          className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${ringClass}`}
            >
              <CheckIcon className="size-3" />
            </span>
            <p className="text-sm leading-6 text-foreground">{feature}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    getMySubscription()
      .then((sub) => setSubscription(sub || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, user]);

  async function handleSubscribe() {
    if (!user) return;

    setSubmitting(true);
    try {
      const result = await subscribeToPlan("Pro Vendor");
      setSubscription(result);
      toast.success("Subscribed to Pro Vendor.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-[var(--radius-xl)]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[420px] rounded-[var(--radius-xl)]" />
          <Skeleton className="h-[420px] rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="space-y-6">
        <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
              >
                Active vendor plan
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
                Pro Vendor is active.
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                Access is already unlocked for normal vendor operations. Keep the renewal date in
                view and reach support only if billing changes are needed.
              </p>
            </div>

            <Link href="/vendor" className={buttonVariants({ variant: "outline" })}>
              Back to overview
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <SubscriptionMetric
              label="Plan"
              value={subscription?.plan_name || "Pro Vendor"}
            />
            <SubscriptionMetric
              label="Status"
              value={subscription?.status || "ACTIVE"}
            />
            <SubscriptionMetric
              label="Renews"
              value={subscription ? formatDate(subscription.end_date) : "--"}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="surface-panel rounded-[var(--radius-xl)] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Included right now
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Everything in the working plan.
            </h2>
            <div className="mt-6">
              <FeatureList features={PLAN_FEATURES} accent="active" />
            </div>
          </div>

          <aside className="surface-panel rounded-[var(--radius-xl)] p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-[color:var(--color-brand)]">
                <CreditCard className="size-4" />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground">Billing snapshot</p>
                <p className="text-sm text-muted-foreground">A short view of the current cycle.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SubscriptionMetric
                label="Started"
                value={subscription ? formatDate(subscription.start_date) : "--"}
              />
              <SubscriptionMetric
                label="Renews"
                value={subscription ? formatDate(subscription.end_date) : "--"}
              />
            </div>

            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              To modify or cancel the subscription, contact{" "}
              <a
                href="mailto:support@snapcos.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                support@snapcos.com
              </a>
              . Changes apply at the end of the current billing period.
            </p>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Pro Vendor
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
              One plan. One price.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              Subscribe once to unlock the full vendor workspace without mixing billing noise into
              day-to-day operations.
            </p>
          </div>

          <Link href="/vendor" className={buttonVariants({ variant: "outline" })}>
            Back to overview
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel rounded-[var(--radius-xl)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Plan access
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-0.04em] text-foreground">
              PHP 29
            </span>
            <span className="pb-1 text-sm text-muted-foreground">per month</span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            A simple monthly plan for vendors who want predictable access and full marketplace
            tools.
          </p>

          <div className="mt-6">
            <FeatureList features={PLAN_FEATURES} />
          </div>
        </div>

        <aside className="surface-shell rounded-[var(--radius-xl)] p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-[color:var(--color-brand)]">
              <CreditCard className="size-4" />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">Activate vendor access</p>
              <p className="text-sm text-muted-foreground">Billing stays simple and predictable.</p>
            </div>
          </div>

          <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Includes
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Full vendor publishing access, reservations flow, and plan support.
            </p>
          </div>

          <div className="mt-3 rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Terms
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              No hidden fees. Cancel anytime. Changes apply at the end of the current billing
              period.
            </p>
          </div>

          <Button
            type="button"
            variant="brand"
            size="lg"
            className="mt-6 w-full"
            onClick={handleSubscribe}
            disabled={submitting}
          >
            <CreditCard className="size-4" />
            {submitting ? "Processing..." : "Subscribe now"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Billing is handled securely.
          </p>
        </aside>
      </section>
    </div>
  );
}
