"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMySubscription, subscribeToPlan, type Subscription } from "@/lib/vendor";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckIcon, ArrowLeftIcon as ArrowLeft } from "@radix-ui/react-icons";
import { CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── plan details ──────────────────────────────────────────────────────────────

const PLAN_FEATURES = [
  "0% commission on all rentals",
  "Unlimited costume listings",
  "Priority placement in search results",
  "Direct messaging with renters",
  "Advanced analytics dashboard",
  "Dedicated vendor support",
];

// ── component ─────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { token } = useAuth();
  const router    = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    if (!token) { router.push("/login?next=/vendor/subscription"); return; }
    getMySubscription(token)
      .then((sub) => setSubscription(sub || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router]);

  async function handleSubscribe() {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await subscribeToPlan("Pro Vendor", token);
      setSubscription(res);
      toast.success("Subscribed to Pro Vendor — welcome aboard.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  // ── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-16">
        <div className="mb-16 space-y-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="lg:col-span-7">
            <Skeleton className="h-64 w-full rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  // ── main ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-16">

      {/* Back link */}
      <Link
        href="/vendor"
        className="mb-12 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Vendor Dashboard
      </Link>

      {/* Page header */}
      <div className="mb-16 max-w-xl animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
          Subscription
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Manage your vendor plan. List costumes, accept reservations, and keep every peso.
        </p>
      </div>

      {/* ── Active subscription ── */}
      {isActive ? (
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 animate-fade-up-delay-1">

          {/* Status panel */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="border border-border rounded-sm p-8 flex flex-col gap-8">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Current plan
                  </p>
                  <p className="font-playfair text-3xl font-semibold text-foreground">
                    {subscription!.plan_name}
                  </p>
                </div>
                <span className={cn(
                  "shrink-0 rounded-sm border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest",
                  subscription!.status === "ACTIVE"
                    ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-400/40 text-amber-700 dark:text-amber-400"
                )}>
                  {subscription!.status}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Start date
                  </p>
                  <p className="font-playfair text-lg font-semibold text-foreground">
                    {formatDate(subscription!.start_date)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Renewal date
                  </p>
                  <p className="font-playfair text-lg font-semibold text-foreground">
                    {formatDate(subscription!.end_date)}
                  </p>
                </div>
              </div>

              {/* Features included */}
              <div className="border-t border-border pt-6 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  What's included
                </p>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PLAN_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-emerald-400/40 text-emerald-700 dark:text-emerald-400">
                        <CheckIcon className="size-2.5" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cancel note */}
            <p className="text-xs text-muted-foreground border-l-2 border-border pl-4 leading-relaxed">
              To modify or cancel your subscription, contact{" "}
              <a href="mailto:support@snapcos.com" className="underline underline-offset-4 hover:text-foreground">
                support@snapcos.com
              </a>
              . Changes take effect at the end of your current billing period.
            </p>
          </div>

          {/* Side summary */}
          <div className="lg:col-span-5">
            <div className="border border-border rounded-sm p-8 space-y-6 sticky top-24">
              <div className="text-muted-foreground/20">
                <CreditCard className="size-8" />
              </div>
              <div>
                <p className="font-playfair text-2xl font-semibold text-foreground">
                  You're all set.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Your Pro Vendor subscription is active. You can list unlimited costumes and accept reservations with no commission fees.
                </p>
              </div>
              <Link
                href="/vendor"
                className="inline-flex h-10 items-center rounded-sm border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ── No subscription — upsell ── */
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 animate-fade-up-delay-1">

          {/* Why subscribe */}
          <div className="lg:col-span-5 flex flex-col gap-12">
            <div className="space-y-6">
              <h2 className="font-playfair text-3xl font-semibold text-foreground">
                Why subscribe?
              </h2>
              <ul className="space-y-5">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-4">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-border text-foreground">
                      <CheckIcon className="size-3" />
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-4">
              No hidden fees. Cancel anytime. Your listings remain visible to renters even during brief lapses.
            </p>
          </div>

          {/* Pricing card */}
          <div className="lg:col-span-7">
            <div className="border border-border rounded-sm p-8 md:p-12 flex flex-col gap-10">

              {/* Price header */}
              <div className="space-y-4 border-b border-border pb-8">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Pro Vendor
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-playfair text-6xl font-semibold tracking-tight text-foreground">
                    ₱29
                  </span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Everything you need to run a professional costume rental business on SnapCos.
                </p>
              </div>

              {/* Feature summary */}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-xs text-muted-foreground">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-border text-foreground">
                      <CheckIcon className="size-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-col gap-4 border-t border-border pt-8">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard className="size-3.5" />
                  {submitting ? "Processing…" : "Subscribe now"}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Cancel anytime. Billing is handled securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
