"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArchiveIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  RocketIcon,
} from "@radix-ui/react-icons";

import { VendorApplicationPreviewDialog } from "@/components/VendorApplicationPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getVendorProfile, listVendorCostumes, type VendorCostume, type VendorProfile } from "@/lib/vendor";

function statBlock(label: string, value: number | string) {
  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-4 font-playfair text-4xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function stepBlock(step: string, title: string, copy: string) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{step}</p>
      <p className="mt-3 font-playfair text-2xl font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy}</p>
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
        const [vendorData, costumeData] = await Promise.allSettled([getVendorProfile(), listVendorCostumes()]);

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
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-16 w-80 rounded-sm" />
          <Skeleton className="h-48 w-full rounded-sm" />
        </div>
      </div>
    );
  }

  const vendorStatus = profile?.vendorStatus ?? "NONE";
  const storeName = profile?.profile?.business_name || user?.name || "Your atelier";

  if (vendorStatus === "NONE") {
    return (
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-16">
        <section className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Vendor House
            </p>
            <h1 className="max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Turn your costume collection into a curated rental storefront.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Apply once, prepare your listings in private drafts, and publish your strongest pieces once your house is approved.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/vendor/apply"
                className="inline-flex h-11 items-center justify-center rounded-sm bg-foreground px-6 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
              >
                Start application
              </Link>
              <Link
                href="/vendor/subscription"
                className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                View plans
              </Link>
            </div>
          </div>

          <div className="space-y-4 border border-border bg-muted/30 p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">What happens next</p>
              <p className="mt-3 font-playfair text-3xl font-semibold text-foreground">
                A fast path with clear gates.
              </p>
            </div>
            {stepBlock(
              "01",
              "Apply",
              "Share your boutique details and a real identity document for manual review."
            )}
            {stepBlock(
              "02",
              "Prepare drafts",
              "Start building listings in private while your application is under review."
            )}
            {stepBlock(
              "03",
              "Publish with confidence",
              "Once approved, move your best pieces live and start receiving requests."
            )}
          </div>
        </section>
      </div>
    );
  }

  if (vendorStatus === "PENDING") {
    return (
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-16">
        <section className="border-b border-border pb-12">
          <div className="inline-flex items-center gap-2 rounded-sm border border-amber-400/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <RocketIcon className="size-3" />
            Under review
          </div>
          <h1 className="mt-6 max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
            {storeName} is in review.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            Your application has been received. While we review your documents, you can begin shaping private drafts so your collection is ready the moment approval lands.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/vendor/inventory"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-foreground px-6 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
            >
              Prepare drafts
            </Link>
            <button
              type="button"
              onClick={() => setSubmissionPreviewOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              View submission
            </button>
          </div>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {statBlock("Drafts in progress", counts.drafts)}
          {statBlock("Active listings", counts.active)}
          {statBlock("Moderated", counts.moderated)}
        </div>

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
      <div className="mx-auto max-w-[1000px] px-6 pb-24 pt-16">
        <section className="space-y-8 border-b border-border pb-12">
          <div className="inline-flex items-center gap-2 rounded-sm border border-destructive/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-destructive">
            <ExclamationTriangleIcon className="size-3" />
            Action needed
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Your application needs another pass.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Review the note from the team, refresh your identity document if needed, and resubmit when everything is ready.
            </p>
          </div>

          {profile?.profile?.review_note ? (
            <div className="max-w-2xl rounded-sm border border-destructive/20 bg-destructive/5 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-destructive">Review note</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{profile.profile.review_note}</p>
            </div>
          ) : null}

          <div>
            <Link
              href="/vendor/apply"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-foreground px-6 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
            >
              Resubmit application
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <section className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-sm border border-emerald-400/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            <CheckIcon className="size-3" />
            Approved vendor
          </div>
          <div>
            <h1 className="max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Welcome to your house, {storeName}.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Shape new drafts, publish your strongest silhouettes, and manage the health of your collection from one focused workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vendor/inventory"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-foreground px-6 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
            >
              Manage inventory
            </Link>
            <Link
              href="/vendor/reservations"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              Review reservations
            </Link>
          </div>
        </div>

        <div className="space-y-4 border border-border bg-muted/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Operating note</p>
          <p className="font-playfair text-3xl font-semibold text-foreground">
            Only active listings enter the reservation flow.
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Drafts stay private, moderated listings stay out of customer reach, and only approved live pieces can be booked.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <ArchiveIcon className="size-3.5" />
            Review every status in inventory
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {statBlock("Total listings", counts.total)}
        {statBlock("Drafts", counts.drafts)}
        {statBlock("Live listings", counts.active)}
        {statBlock("Moderated", counts.moderated)}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next best move</p>
          <p className="mt-4 font-playfair text-3xl font-semibold text-foreground">
            {counts.drafts > 0
              ? "Polish your drafts and publish the front-runner."
              : "Create the first draft your renters will remember."}
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Keep the collection sharp, photograph with clarity, and bring only the strongest pieces live. A focused storefront feels more premium than a crowded one.
          </p>
        </div>

        <div className="rounded-sm border border-border bg-muted/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Collection health</p>
          <p className="mt-4 font-playfair text-3xl font-semibold text-foreground">
            Drafts, live pieces, and moderated listings each need different care.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Use draft mode for shaping copy and imagery, keep active listings accurate for renters, and treat moderated listings as content that needs revision before it can return.
          </p>
        </div>
      </section>
    </div>
  );
}
