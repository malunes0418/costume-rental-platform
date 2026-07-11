"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArchiveIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  RocketIcon,
} from "@radix-ui/react-icons";

import { Sparkle } from "@/components/brand/Sparkle";
import { VendorApplicationPreviewDialog } from "@/components/VendorApplicationPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  getVendorProfile,
  listVendorCostumes,
  type VendorCostume,
  type VendorProfile,
} from "@/lib/vendor";

const HOUSE_CUES = [
  {
    step: "01",
    title: "Audition",
    copy: "Share your boutique details and a real identity document for manual review.",
  },
  {
    step: "02",
    title: "Rehearse drafts",
    copy: "Build listings in private while your application is under review.",
  },
  {
    step: "03",
    title: "Open night",
    copy: "Once approved, move your best pieces live and start receiving requests.",
  },
] as const;

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "coral" | "gold" | "emerald" | "amber";
}) {
  return (
    <div
      className={cn(
        "vendor-stat-chip flex min-w-[7.5rem] flex-col gap-1 rounded-xl border px-4 py-4",
        tone === "coral" && "border-primary/25 bg-brand-coral-soft",
        tone === "gold" && "border-accent/30 bg-brand-gold-soft",
        tone === "emerald" && "border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20",
        tone === "amber" && "border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20",
        tone === "default" && "border-border bg-card"
      )}
    >
      <span className="font-display text-3xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function VendorOverviewPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<VendorCostume[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionPreviewOpen, setSubmissionPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [vendorData, costumeData] = await Promise.allSettled([
          getVendorProfile(),
          listVendorCostumes(),
        ]);

        if (vendorData.status === "fulfilled") {
          setProfile(vendorData.value);
        }

        if (costumeData.status === "fulfilled") {
          setCostumes(costumeData.value);
        } else {
          setCostumes([]);
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [user]);

  const counts = useMemo(() => {
    return costumes.reduce(
      (acc, costume) => {
        acc.total += 1;
        if (costume.status === "DRAFT") acc.drafts += 1;
        if (costume.status === "ACTIVE") acc.active += 1;
        if (costume.status === "HIDDEN" || costume.status === "FLAGGED") acc.moderated += 1;
        return acc;
      },
      { total: 0, drafts: 0, active: 0, moderated: 0 }
    );
  }, [costumes]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="space-y-4">
          <Skeleton className="h-4 w-40 rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const vendorStatus = profile?.vendorStatus ?? "NONE";
  const storeName = profile?.profile?.business_name || user?.name || "Your atelier";
  const needsPayment = profile?.blockingReasons.includes("PAYMENT_DETAILS_REQUIRED") ?? false;

  if (vendorStatus === "NONE") {
    return <ProspectOverview />;
  }

  if (vendorStatus === "PENDING") {
    return (
      <>
        <PendingOverview
          storeName={storeName}
          counts={counts}
          onViewSubmission={() => setSubmissionPreviewOpen(true)}
        />
        <VendorApplicationPreviewDialog
          open={submissionPreviewOpen}
          onOpenChange={setSubmissionPreviewOpen}
          profile={profile?.profile ?? null}
          status={vendorStatus}
        />
      </>
    );
  }

  if (vendorStatus === "REJECTED") {
    return <RejectedOverview reviewNote={profile?.profile?.review_note} />;
  }

  return (
    <ApprovedOverview
      storeName={storeName}
      counts={counts}
      needsPayment={needsPayment}
    />
  );
}

function ProspectOverview() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="vendor-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <Sparkle
          size="md"
          className="pointer-events-none absolute right-[11%] top-[16%] opacity-80 max-sm:hidden"
        />
        <Sparkle
          size="sm"
          animated={false}
          className="pointer-events-none absolute bottom-[22%] left-[7%] opacity-55 max-sm:hidden"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkle size="sm" animated={false} />
              Vendor House · Opening
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Turn your wardrobe into a curated{" "}
              <span className="italic text-primary">house</span>.
            </h1>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Audition once, rehearse private drafts, and publish your strongest pieces the moment the house is approved.
            </p>
            <div className="animate-fade-up-delay-3 flex flex-wrap gap-3 pt-2">
              <Link
                href="/vendor/apply"
                className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
              >
                Start application
              </Link>
              <Link
                href="/vendor/subscription"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                View plans
              </Link>
            </div>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="House path">
            <StatChip label="Gate" value="Apply" tone="coral" />
            <StatChip label="While you wait" value="Drafts" tone="gold" />
            <StatChip label="After approval" value="Live" />
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="animate-fade-up space-y-4 rounded-2xl border border-border bg-muted/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Call sheet
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            Three cues to opening night.
          </p>
          <p className="max-w-prose text-sm leading-7 text-muted-foreground">
            Clear gates. Real review. Momentum even before you go live.
          </p>
        </div>

        <ol className="animate-fade-up-delay-1 space-y-3">
          {HOUSE_CUES.map((cue, index) => (
            <li
              key={cue.step}
              className="subscription-cue flex gap-4 rounded-xl border border-border bg-card p-5"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="font-display text-3xl font-semibold leading-none text-primary/80">
                {cue.step}
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-foreground">{cue.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{cue.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PendingOverview({
  storeName,
  counts,
  onViewSubmission,
}: {
  storeName: string;
  counts: { drafts: number; active: number; moderated: number };
  onViewSubmission: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="vendor-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <Sparkle
          size="md"
          className="pointer-events-none absolute right-[12%] top-[18%] opacity-80 max-sm:hidden"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkle size="sm" animated={false} />
              Vendor House · In the wings
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {storeName} is under{" "}
              <span className="italic text-primary">review</span>.
            </h1>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Your audition is in. Rehearse private drafts so the collection is ready the moment approval lands.
            </p>
            <div className="animate-fade-up-delay-3 flex flex-wrap gap-3 pt-2">
              <Link
                href="/vendor/inventory"
                className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
              >
                Prepare drafts
              </Link>
              <button
                type="button"
                onClick={onViewSubmission}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                View submission
              </button>
            </div>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="Collection pulse">
            <StatChip label="Drafts" value={counts.drafts} tone="coral" />
            <StatChip label="Live" value={counts.active} tone="amber" />
            <StatChip label="Moderated" value={counts.moderated} />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <RocketIcon className="size-3.5" />
            While you wait
          </p>
          <p className="mt-4 font-display text-3xl font-semibold text-foreground">
            Shape the wardrobe in private.
          </p>
          <p className="mt-4 max-w-prose text-sm leading-7 text-muted-foreground">
            Drafts stay backstage. Customers only see published active listings after your house is approved.
          </p>
        </div>

        <aside className="animate-fade-up-delay-1 space-y-4 rounded-2xl border border-border bg-muted/30 p-6">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <Sparkle size="sm" animated={false} />
            Next cue
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {counts.drafts > 0
              ? "Polish the front-runner draft."
              : "Create the first look renters will remember."}
          </p>
          <Link
            href="/vendor/inventory"
            className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
          >
            Open inventory
          </Link>
        </aside>
      </div>
    </div>
  );
}

function RejectedOverview({ reviewNote }: { reviewNote?: string | null }) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="vendor-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-2xl space-y-4">
          <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-destructive">
            <ExclamationTriangleIcon className="size-3.5" />
            Vendor House · Second take
          </p>
          <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Your application needs another{" "}
            <span className="italic text-primary">pass</span>.
          </h1>
          <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Read the note, refresh your identity document if needed, and resubmit when the story is ready for the stage.
          </p>
          <div className="animate-fade-up-delay-3 pt-2">
            <Link
              href="/vendor/apply"
              className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
            >
              Resubmit application
            </Link>
          </div>
        </div>
      </header>

      {reviewNote ? (
        <div className="animate-fade-up max-w-3xl rounded-2xl border border-destructive/25 bg-destructive/5 p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-destructive">
            Review note
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{reviewNote}</p>
        </div>
      ) : null}
    </div>
  );
}

function ApprovedOverview({
  storeName,
  counts,
  needsPayment,
}: {
  storeName: string;
  counts: { total: number; drafts: number; active: number; moderated: number };
  needsPayment: boolean;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="vendor-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <Sparkle
          size="md"
          className="pointer-events-none absolute right-[10%] top-[16%] opacity-80 max-sm:hidden"
        />
        <Sparkle
          size="sm"
          animated={false}
          className="pointer-events-none absolute bottom-[20%] left-[8%] opacity-55 max-sm:hidden"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkle size="sm" animated={false} />
              Vendor House · House open
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Welcome to your house,{" "}
              <span className="italic text-primary">{storeName}</span>.
            </h1>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Shape drafts, publish your strongest silhouettes, and keep the collection sharp from one focused workspace.
            </p>
            <div className="animate-fade-up-delay-3 flex flex-wrap gap-3 pt-2">
              <Link
                href="/vendor/inventory"
                className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
              >
                Manage inventory
              </Link>
              {needsPayment ? (
                <Link
                  href="/vendor/settings"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-50/50 px-6 text-xs font-semibold uppercase tracking-widest text-amber-800 transition-colors hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-300"
                >
                  Add payment details
                </Link>
              ) : (
                <Link
                  href="/vendor/reservations"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                >
                  Review reservations
                </Link>
              )}
            </div>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="Collection health">
            <StatChip label="Total" value={counts.total} />
            <StatChip label="Drafts" value={counts.drafts} tone="gold" />
            <StatChip label="Live" value={counts.active} tone="coral" />
            <StatChip label="Moderated" value={counts.moderated} tone="emerald" />
          </div>
        </div>
      </header>

      {needsPayment ? (
        <div className="mb-8 max-w-3xl animate-fade-up rounded-2xl border border-amber-400/40 bg-amber-50/50 px-5 py-5 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <RocketIcon className="size-3.5" />
            Payment details required
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Add at least one active payment method before you can publish listings or accept reservations. Customers need your GCash, Maya, or bank details at checkout.
          </p>
          <Link
            href="/vendor/settings"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
          >
            Go to settings
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-fade-up space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <Sparkle size="sm" animated={false} />
            Next cue
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {counts.drafts > 0
              ? "Polish your drafts and publish the front-runner."
              : "Create the first draft your renters will remember."}
          </p>
          <p className="max-w-prose text-sm leading-7 text-muted-foreground">
            Keep the collection sharp, photograph with clarity, and bring only the strongest pieces live. A focused storefront feels more premium than a crowded one.
          </p>
          <Link
            href="/vendor/inventory"
            className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
          >
            Open inventory
          </Link>
        </div>

        <aside className="animate-fade-up-delay-1 space-y-4 rounded-2xl border border-border bg-muted/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Operating note
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            Only active listings enter the reservation flow.
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Drafts stay private, moderated listings stay out of customer reach, and only approved live pieces can be booked.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <ArchiveIcon className="size-3.5" />
            Review every status in inventory
          </div>
        </aside>
      </div>
    </div>
  );
}
