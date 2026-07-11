"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@radix-ui/react-icons";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  getMySubscription,
  getVendorProfile,
  subscribeToPlan,
  type Subscription,
  type VendorStatus,
} from "@/lib/vendor";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const PLAN_CUES = [
  { step: "01", title: "Zero commission", copy: "Keep every peso from every rental — no platform cut." },
  { step: "02", title: "Unlimited listings", copy: "Build the full wardrobe. No caps on how many looks go live." },
  { step: "03", title: "Priority placement", copy: "Your pieces surface earlier when renters are hunting." },
  { step: "04", title: "Direct messaging", copy: "Talk to renters without leaving the house." },
  { step: "05", title: "Advanced analytics", copy: "See what moves, what stalls, and what to publish next." },
  { step: "06", title: "Dedicated support", copy: "A real human when the show needs a stage manager." },
] as const;

function isSubscribed(subscription: Subscription | null) {
  return subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>("NONE");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    async function load() {
      try {
        const [sub, profile] = await Promise.allSettled([
          getMySubscription(),
          getVendorProfile(),
        ]);

        if (sub.status === "fulfilled") {
          setSubscription(sub.value || null);
        }
        if (profile.status === "fulfilled") {
          setVendorStatus(profile.value.vendorStatus);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, router]);

  async function handleSubscribe() {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await subscribeToPlan("Pro Vendor");
      setSubscription(res);
      toast.success("Subscribed to Pro Vendor — welcome aboard.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const active = isSubscribed(subscription);
  const isApprovedVendor = vendorStatus === "APPROVED";
  const isApplicant = !isApprovedVendor;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="space-y-4">
          <Skeleton className="h-4 w-40 rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="subscription-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <Sparkle
          size="md"
          className="pointer-events-none absolute right-[12%] top-[18%] opacity-80 max-sm:hidden"
        />
        <Sparkle
          size="sm"
          animated={false}
          className="pointer-events-none absolute bottom-[22%] left-[8%] opacity-60 max-sm:hidden"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkle size="sm" animated={false} />
              {isApplicant ? "Vendor House · Plans" : "Vendor House · Membership"}
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {active ? (
                <>
                  You&apos;re in the{" "}
                  <span className="italic text-primary">cast</span>.
                </>
              ) : isApplicant ? (
                <>
                  Snap into the{" "}
                  <span className="italic text-primary">house</span>.
                </>
              ) : (
                <>
                  Keep every{" "}
                  <span className="italic text-primary">peso</span>.
                </>
              )}
            </h1>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {active
                ? "Your Pro Vendor membership is live. List freely, accept reservations, and run the collection without commission drag."
                : isApplicant
                  ? "Pro Vendor is the membership for boutique owners who want a curated storefront with zero commission — whether you are applying or already under review."
                  : "Pro Vendor unlocks unlimited listings, priority placement, and zero commission on every rental."}
            </p>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="Plan status">
            <div
              className={cn(
                "flex min-w-[8rem] flex-col gap-0.5 rounded-xl border px-4 py-3",
                active
                  ? "border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-primary/25 bg-brand-coral-soft"
              )}
            >
              <span className="font-display text-2xl font-semibold text-foreground">
                {active ? "Live" : "₱29"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {active ? subscription!.plan_name : "Per month"}
              </span>
            </div>
            <div
              className={cn(
                "flex min-w-[8rem] flex-col gap-0.5 rounded-xl border px-4 py-3",
                isApprovedVendor
                  ? "border-accent/30 bg-brand-gold-soft"
                  : "border-border bg-card"
              )}
            >
              <span className="font-display text-2xl font-semibold text-foreground">
                {vendorStatus === "NONE"
                  ? "Apply"
                  : vendorStatus === "PENDING"
                    ? "Review"
                    : vendorStatus === "REJECTED"
                      ? "Resubmit"
                      : "Approved"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Vendor status
              </span>
            </div>
            <div className="flex min-w-[8rem] flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
              <span className="font-display text-2xl font-semibold text-foreground">0%</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Commission
              </span>
            </div>
          </div>
        </div>
      </header>

      {active ? (
        <ActiveMembership
          subscription={subscription!}
          isApplicant={isApplicant}
          vendorStatus={vendorStatus}
        />
      ) : (
        <PlanUpsell
          isApplicant={isApplicant}
          vendorStatus={vendorStatus}
          submitting={submitting}
          onSubscribe={() => void handleSubscribe()}
        />
      )}
    </div>
  );
}

function PlanUpsell({
  isApplicant,
  vendorStatus,
  submitting,
  onSubscribe,
}: {
  isApplicant: boolean;
  vendorStatus: VendorStatus;
  submitting: boolean;
  onSubscribe: () => void;
}) {
  const secondaryHref =
    vendorStatus === "NONE"
      ? "/vendor/apply"
      : vendorStatus === "REJECTED"
        ? "/vendor/apply"
        : isApplicant
          ? "/vendor"
          : "/vendor/inventory";

  const secondaryLabel =
    vendorStatus === "NONE"
      ? "Start application"
      : vendorStatus === "REJECTED"
        ? "Resubmit application"
        : isApplicant
          ? "Back to overview"
          : "Manage inventory";

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="animate-fade-up space-y-4">
        <div className="rounded-xl border border-border bg-muted/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Call sheet
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-foreground">
            Six cues. One membership.
          </p>
          <p className="mt-3 max-w-prose text-sm leading-7 text-muted-foreground">
            Built for boutique houses that want theatrical presence without SaaS filler — clear gates, real support, and every peso staying yours.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {PLAN_CUES.map((cue, index) => (
            <li
              key={cue.step}
              className="subscription-cue rounded-xl border border-border bg-card p-5"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {cue.step}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-foreground">{cue.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{cue.copy}</p>
            </li>
          ))}
        </ul>
      </div>

      <aside className="animate-fade-up-delay-1 subscription-price-stage relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:sticky lg:top-6 lg:self-start">
        <Sparkle size="sm" className="absolute right-6 top-6 opacity-90" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
          Pro Vendor
        </p>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-7xl font-semibold tracking-tight text-foreground md:text-8xl">
            ₱29
          </span>
          <span className="text-sm font-medium text-muted-foreground">/ month</span>
        </div>
        <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
          Everything you need to run a professional costume rental house on SnapCos — without commission drag.
        </p>

        <ul className="mt-8 space-y-3 border-t border-primary/15 pt-8">
          {PLAN_CUES.map((cue) => (
            <li key={cue.step} className="flex items-start gap-3 text-sm text-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CheckIcon className="size-2.5" />
              </span>
              <span className="leading-6">{cue.title}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3 border-t border-primary/15 pt-8">
          <button
            type="button"
            onClick={onSubscribe}
            disabled={submitting}
            className="hover-snap flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-primary text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CreditCard className="size-3.5" />
            {submitting ? "Processing…" : "Subscribe now"}
          </button>
          <Link
            href={secondaryHref}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card/70 px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
          >
            {secondaryLabel}
          </Link>
          <p className="text-center text-xs leading-6 text-muted-foreground">
            {isApplicant
              ? "Membership and application are separate — subscribe anytime, then finish your boutique review."
              : "Cancel anytime. Billing is handled securely."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function ActiveMembership({
  subscription,
  isApplicant,
  vendorStatus,
}: {
  subscription: Subscription;
  isApplicant: boolean;
  vendorStatus: VendorStatus;
}) {
  const primaryHref =
    vendorStatus === "NONE" || vendorStatus === "REJECTED"
      ? "/vendor/apply"
      : vendorStatus === "PENDING"
        ? "/vendor/inventory"
        : "/vendor/inventory";

  const primaryLabel =
    vendorStatus === "NONE"
      ? "Start application"
      : vendorStatus === "REJECTED"
        ? "Resubmit application"
        : vendorStatus === "PENDING"
          ? "Prepare drafts"
          : "Manage inventory";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="animate-fade-up space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Current plan
              </p>
              <p className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">
                {subscription.plan_name}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest",
                subscription.status === "ACTIVE"
                  ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-400/40 text-amber-700 dark:text-amber-400"
              )}
            >
              <CheckIcon className="size-3" />
              {subscription.status === "ACTIVE" ? "Plan active" : "Trialing"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/30 bg-brand-gold-soft p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Start date
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                {formatDate(subscription.start_date)}
              </p>
            </div>
            <div className="rounded-xl border border-primary/25 bg-brand-coral-soft p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Renewal date
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                {formatDate(subscription.end_date)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            What&apos;s included
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {PLAN_CUES.map((cue) => (
              <li key={cue.step} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 text-emerald-700 dark:text-emerald-400">
                  <CheckIcon className="size-2.5" />
                </span>
                {cue.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Need a change?
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            To modify or cancel, contact{" "}
            <a
              href="mailto:support@snapcos.com"
              className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              support@snapcos.com
            </a>
            . Changes take effect at the end of your billing period.
          </p>
        </div>
      </div>

      <aside className="animate-fade-up-delay-1 space-y-4 rounded-2xl border border-border bg-muted/30 p-6 lg:sticky lg:top-6 lg:self-start">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
          <Sparkle size="sm" animated={false} />
          Next cue
        </p>
        <p className="font-display text-3xl font-semibold text-foreground">
          {isApplicant
            ? "Membership is set. Finish the house."
            : "You&apos;re all set. Keep the collection sharp."}
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          {isApplicant
            ? "Your plan is active. Complete boutique review so renters can discover your looks."
            : "List unlimited costumes and accept reservations with no commission fees."}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={primaryHref}
            className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
          >
            {primaryLabel}
          </Link>
          <Link
            href="/vendor"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
          >
            Go to overview
          </Link>
        </div>
      </aside>
    </div>
  );
}
