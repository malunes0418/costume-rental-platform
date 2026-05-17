"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  RocketIcon,
  SewingPinFilledIcon,
} from "@radix-ui/react-icons";

import { VendorApplicationPreviewDialog } from "@/components/VendorApplicationPreview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  getVendorProfile,
  listVendorCostumes,
  listVendorReservations,
  type Reservation,
  type VendorCostume,
  type VendorProfile,
} from "@/lib/vendor";
import { cn } from "@/lib/utils";

function OverviewMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="surface-panel rounded-[var(--radius-xl)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
        <p className="max-w-[10rem] text-right text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  copy,
  href,
  cta,
}: {
  title: string;
  copy: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="surface-panel rounded-[var(--radius-xl)] p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
      <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
        {cta}
      </Link>
    </div>
  );
}

function PriorityRow({
  title,
  summary,
  href,
  cta,
}: {
  title: string;
  summary: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>
        <Link
          href={href}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-start md:justify-center")}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function statusAccent(status: VendorProfile["vendorStatus"]) {
  if (status === "APPROVED") {
    return "border-emerald-400/40 text-emerald-700 dark:text-emerald-400";
  }
  if (status === "PENDING") {
    return "border-amber-400/40 text-amber-700 dark:text-amber-400";
  }
  if (status === "REJECTED") {
    return "border-destructive/30 text-destructive";
  }
  return "border-border text-muted-foreground";
}

export default function VendorOverviewPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<VendorCostume[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionPreviewOpen, setSubmissionPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [vendorData, costumeData, reservationData] = await Promise.allSettled([
          getVendorProfile(),
          listVendorCostumes(),
          listVendorReservations(),
        ]);

        if (vendorData.status === "fulfilled") {
          setProfile(vendorData.value);
        }

        if (costumeData.status === "fulfilled") {
          setCostumes(costumeData.value);
        } else {
          setCostumes([]);
        }

        if (reservationData.status === "fulfilled") {
          setReservations(reservationData.value);
        } else {
          setReservations([]);
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [user]);

  const counts = useMemo(() => {
    return costumes.reduce(
      (accumulator, costume) => {
        accumulator.total += 1;
        if (costume.status === "DRAFT") accumulator.drafts += 1;
        if (costume.status === "ACTIVE") accumulator.active += 1;
        if (costume.status === "HIDDEN" || costume.status === "FLAGGED") {
          accumulator.moderated += 1;
        }
        return accumulator;
      },
      { total: 0, drafts: 0, active: 0, moderated: 0 }
    );
  }, [costumes]);

  const reservationCounts = useMemo(() => {
    return reservations.reduce(
      (accumulator, reservation) => {
        if (
          reservation.status === "PAID" &&
          reservation.vendor_status === "PENDING_VENDOR"
        ) {
          accumulator.needsReview += 1;
        }
        if (
          reservation.status === "PENDING_PAYMENT" &&
          reservation.vendor_status === "PENDING_VENDOR"
        ) {
          accumulator.awaitingCustomer += 1;
        }
        if (reservation.vendor_status === "CONFIRMED") {
          accumulator.confirmed += 1;
        }
        return accumulator;
      },
      { needsReview: 0, awaitingCustomer: 0, confirmed: 0 }
    );
  }, [reservations]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[var(--radius-xl)]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-[var(--radius-xl)]" />
          ))}
        </div>
      </div>
    );
  }

  const vendorStatus = profile?.vendorStatus ?? "NONE";
  const storeName = profile?.profile?.business_name || user?.name || "Your vendor house";
  const accentClass = statusAccent(vendorStatus);

  if (vendorStatus === "NONE") {
    return (
      <div className="space-y-6">
        <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
          <Badge variant="outline" className={accentClass}>
            Vendor setup required
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            Start your vendor workspace.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            Apply first, then use the workspace to build drafts and prepare for approval. The flow
            is intentionally staged so listings stay clean before they go live.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vendor/apply" className={buttonVariants({ variant: "brand" })}>
              Start application
            </Link>
            <Link href="/vendor/subscription" className={buttonVariants({ variant: "outline" })}>
              Review plan
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ActionCard
            title="Apply"
            copy="Submit the business profile and identity document the team needs to verify your account."
            href="/vendor/apply"
            cta="Open application"
          />
          <ActionCard
            title="Prepare drafts"
            copy="Inventory opens during review so you can shape titles, pricing, and imagery before launch."
            href="/vendor/inventory"
            cta="View inventory"
          />
          <ActionCard
            title="Understand access"
            copy="Check the subscription page only when you need plan or limit details."
            href="/vendor/subscription"
            cta="View subscription"
          />
        </section>
      </div>
    );
  }

  if (vendorStatus === "PENDING") {
    return (
      <div className="space-y-6">
        <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
          <Badge variant="outline" className={accentClass}>
            <RocketIcon className="size-3" />
            Under review
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            Application under review.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            Your submission is already queued. Use this waiting time to tighten drafts so the
            collection is ready when approval lands.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vendor/inventory" className={buttonVariants({ variant: "brand" })}>
              Prepare drafts
            </Link>
            <button
              type="button"
              onClick={() => setSubmissionPreviewOpen(true)}
              className={buttonVariants({ variant: "outline" })}
            >
              View submission
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <OverviewMetric label="Drafts" value={counts.drafts} hint="Still being prepared." />
          <OverviewMetric label="Live" value={counts.active} hint="Should stay at zero." />
          <OverviewMetric
            label="Moderated"
            value={counts.moderated}
            hint="Need fixes before launch."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ActionCard
            title="Refine the launch set"
            copy="Sharpen imagery, pricing, and descriptions while nothing is public yet."
            href="/vendor/inventory"
            cta="Go to inventory"
          />
          <ActionCard
            title="Keep plan details secondary"
            copy="Review subscription info only if you need to confirm access or listing limits."
            href="/vendor/subscription"
            cta="Review subscription"
          />
        </section>

        <VendorApplicationPreviewDialog
          open={submissionPreviewOpen}
          onOpenChange={setSubmissionPreviewOpen}
          profile={profile?.profile ?? null}
          status={vendorStatus}
        />
      </div>
    );
  }

  if (vendorStatus === "REJECTED") {
    return (
      <div className="space-y-6">
        <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
          <Badge variant="outline" className={accentClass}>
            <ExclamationTriangleIcon className="size-3" />
            Action needed
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            Your application needs revision.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            Fix the review blockers first, then resubmit with a cleaner business profile and
            supporting details.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vendor/apply" className={buttonVariants({ variant: "brand" })}>
              Resubmit application
            </Link>
            <button
              type="button"
              onClick={() => setSubmissionPreviewOpen(true)}
              className={buttonVariants({ variant: "outline" })}
            >
              Review previous submission
            </button>
          </div>
        </section>

        {profile?.profile?.review_note ? (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="size-4" />
            <AlertTitle>Review note</AlertTitle>
            <AlertDescription>{profile.profile.review_note}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <ActionCard
            title="Fix the blockers"
            copy="Prioritize missing identity, boutique clarity, or any operational detail called out by the team."
            href="/vendor/apply"
            cta="Open application"
          />
          <ActionCard
            title="Keep inventory light"
            copy="Do not overbuild the catalog until the trust issues are resolved."
            href="/vendor/inventory"
            cta="View inventory state"
          />
        </section>

        <VendorApplicationPreviewDialog
          open={submissionPreviewOpen}
          onOpenChange={setSubmissionPreviewOpen}
          profile={profile?.profile ?? null}
          status={vendorStatus}
        />
      </div>
    );
  }

  const reviewSummary =
    reservationCounts.needsReview > 0
      ? `${reservationCounts.needsReview} paid reservation${reservationCounts.needsReview === 1 ? "" : "s"} need a vendor decision.`
      : "No paid reservations are waiting on you right now.";
  const draftSummary =
    counts.drafts > 0
      ? `${counts.drafts} draft listing${counts.drafts === 1 ? "" : "s"} still need polish before publication.`
      : "Your draft queue is clear.";
  const moderationSummary =
    counts.moderated > 0
      ? `${counts.moderated} listing${counts.moderated === 1 ? "" : "s"} are moderated and need revision.`
      : "No moderated listings are slowing down the storefront.";

  return (
    <div className="space-y-6">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Badge variant="outline" className={accentClass}>
              <CheckIcon className="size-3" />
              Approved vendor
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
              {storeName}
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              Approved and live. Keep the catalog tight, clear incoming reservations quickly, and
              move drafts forward only when they are ready.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/vendor/inventory" className={buttonVariants({ variant: "brand" })}>
              Manage inventory
            </Link>
            <Link href="/vendor/reservations" className={buttonVariants({ variant: "outline" })}>
              Review reservations
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <OverviewMetric label="Listings" value={counts.total} hint="Total in workspace." />
        <OverviewMetric label="Live" value={counts.active} hint="Visible to renters." />
        <OverviewMetric label="Drafts" value={counts.drafts} hint="Still being refined." />
        <OverviewMetric
          label="Needs review"
          value={reservationCounts.needsReview}
          hint="Paid requests awaiting action."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="surface-panel rounded-[var(--radius-xl)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Today
          </p>
          <div className="mt-5 space-y-4">
            <PriorityRow
              title="Reservation decisions"
              summary={reviewSummary}
              href="/vendor/reservations"
              cta="Open reservations"
            />
            <PriorityRow
              title="Draft pipeline"
              summary={draftSummary}
              href="/vendor/inventory"
              cta="Open inventory"
            />
            <PriorityRow
              title="Marketplace health"
              summary={moderationSummary}
              href="/vendor/inventory"
              cta="Review listings"
            />
          </div>
        </div>

        <div className="surface-panel rounded-[var(--radius-xl)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Snapshot
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">Awaiting customer payment</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {reservationCounts.awaitingCustomer}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">Confirmed reservations</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {reservationCounts.confirmed}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-[color:var(--color-brand)]">
                  <SewingPinFilledIcon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Operating principle</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    A smaller set of polished listings will usually outperform a large catalog with
                    weak imagery or unclear status.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActionCard
          title="Inventory"
          copy="Add, refine, and publish listings without losing control of status."
          href="/vendor/inventory"
          cta="Open inventory"
        />
        <ActionCard
          title="Reservations"
          copy="Review proof of payment, confirm renters, and keep the booking queue moving."
          href="/vendor/reservations"
          cta="Open reservations"
        />
        <ActionCard
          title="Earnings"
          copy="Check revenue, pending amounts, and the current payout picture."
          href="/vendor/earnings"
          cta="Open earnings"
        />
      </section>
    </div>
  );
}
