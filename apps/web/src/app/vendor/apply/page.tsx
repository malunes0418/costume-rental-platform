"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { VendorApplicationPreview } from "@/components/VendorApplicationPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { applyForVendor, getVendorProfile, type VendorProfile } from "@/lib/vendor";

const AUDITION_CUES = [
  {
    step: "01",
    title: "Human review",
    copy: "A real person reads your boutique story and identity document before any storefront goes live.",
  },
  {
    step: "02",
    title: "Drafts while you wait",
    copy: "Shape private listings during review. Renters only see pieces you publish after approval.",
  },
  {
    step: "03",
    title: "Curated house",
    copy: "We optimize for trust and a well-shaped marketplace — not volume at any cost.",
  },
] as const;

export default function VendorApply() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const vendorProfile = await getVendorProfile();
        setProfile(vendorProfile);
        setBusinessName(vendorProfile.profile?.business_name || "");
        setBio(vendorProfile.profile?.bio || "");
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    }

    void fetchProfile();
  }, [user]);

  const documentLabel = useMemo(() => {
    if (!documentFile) return "Drop a government ID or PDF";
    return `${documentFile.name} — ${(documentFile.size / 1024 / 1024).toFixed(2)} MB`;
  }, [documentFile]);

  const isRejected = profile?.vendorStatus === "REJECTED";

  if (profileLoading) {
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

  if (profile?.vendorStatus === "PENDING" || profile?.vendorStatus === "APPROVED") {
    return (
      <ReadOnlyApplication
        profile={profile}
        isApproved={profile.vendorStatus === "APPROVED"}
      />
    );
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setDocumentFile(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!user) {
      toast.error("Please log in first.");
      return;
    }

    if (!documentFile) {
      toast.error("Please attach an ID document.");
      return;
    }

    setLoading(true);

    try {
      await applyForVendor({
        business_name: businessName.trim(),
        bio: bio.trim() || undefined,
        id_document: documentFile,
      });
      await refreshUser();
      toast.success("Application submitted for review.");
      router.push("/vendor");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <Link
        href="/vendor"
        className="mb-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3" />
        Back to vendor house
      </Link>

      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="apply-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <Sparkle
          size="md"
          className="pointer-events-none absolute right-[10%] top-[16%] opacity-80 max-sm:hidden"
        />
        <Sparkle
          size="sm"
          animated={false}
          className="pointer-events-none absolute bottom-[20%] left-[6%] opacity-55 max-sm:hidden"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkle size="sm" animated={false} />
              {isRejected ? "Vendor House · Second take" : "Vendor House · Audition"}
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {isRejected ? (
                <>
                  Another{" "}
                  <span className="italic text-primary">pass</span>.
                </>
              ) : (
                <>
                  Audition for the{" "}
                  <span className="italic text-primary">house</span>.
                </>
              )}
            </h1>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {isRejected
                ? "Read the note, refresh your identity document if needed, and resubmit when the story is ready for the stage."
                : "Share the world behind your wardrobe, attach a real identity document, and start shaping private drafts while we review."}
            </p>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="Application status">
            <div
              className={cn(
                "flex min-w-[8rem] flex-col gap-0.5 rounded-xl border px-4 py-3",
                isRejected
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-primary/25 bg-brand-coral-soft"
              )}
            >
              <span className="font-display text-2xl font-semibold text-foreground">
                {isRejected ? "Revise" : "Open"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Application
              </span>
            </div>
            <div className="flex min-w-[8rem] flex-col gap-0.5 rounded-xl border border-accent/30 bg-brand-gold-soft px-4 py-3">
              <span className="font-display text-2xl font-semibold text-foreground">Human</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Review
              </span>
            </div>
            <div className="flex min-w-[8rem] flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
              <span className="font-display text-2xl font-semibold text-foreground">Drafts</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                While you wait
              </span>
            </div>
          </div>
        </div>
      </header>

      {isRejected && profile?.profile?.review_note ? (
        <div className="mb-8 max-w-3xl animate-fade-up rounded-2xl border border-destructive/25 bg-destructive/5 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-destructive">
            <ExclamationTriangleIcon className="size-3.5" />
            Review note
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{profile.profile.review_note}</p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="animate-fade-up space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Call sheet
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-foreground">
              Three cues to opening night.
            </p>
            <p className="mt-3 max-w-prose text-sm leading-7 text-muted-foreground">
              Trust leads. Momentum stays. Even during review, the house invites a meaningful next step.
            </p>
          </div>

          <ol className="space-y-3">
            {AUDITION_CUES.map((cue, index) => (
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

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <Sparkle size="sm" animated={false} />
              Also worth knowing
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Membership is separate from this audition. You can{" "}
              <Link href="/vendor/subscription" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                view Pro Vendor plans
              </Link>{" "}
              anytime — application and subscription do not block each other.
            </p>
          </div>
        </div>

        <section className="animate-fade-up-delay-1 apply-form-stage relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:sticky lg:top-6 lg:self-start">
          <Sparkle size="sm" className="absolute right-6 top-6 opacity-90" />
          <div className="border-b border-primary/15 pb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Boutique profile
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-foreground">
              {isRejected
                ? "Refresh the story. Resubmit the take."
                : "Who are you, and what wardrobe are you bringing?"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <div className="space-y-2">
              <Label
                htmlFor="business-name"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Business name
              </Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Maison Masquerade"
                required
                className="h-12 rounded-xl border-border bg-card/60 text-base text-foreground shadow-none focus-visible:border-primary/40 focus-visible:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="business-bio"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Boutique story
              </Label>
              <textarea
                id="business-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={6}
                placeholder="Describe the world your costumes belong to, the quality of the collection, and the occasions they are best suited for."
                className="w-full resize-y rounded-xl border border-border bg-card/60 px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="id-document"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Identity document
              </Label>
              <label
                htmlFor="id-document"
                data-filled={documentFile ? "true" : "false"}
                className="apply-upload-zone flex cursor-pointer flex-col gap-4 rounded-xl border border-dashed border-border bg-card/40 px-5 py-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-brand-coral-soft text-primary">
                    {documentFile ? <CheckIcon className="size-4" /> : <UploadIcon className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{documentLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Image or PDF, up to 8MB. Used only for manual review.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <FileTextIcon className="size-3.5" />
                  Trust gate — not public
                </div>
              </label>
              <input
                id="id-document"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-3 border-t border-primary/15 pt-6">
              <button
                type="submit"
                disabled={loading || !businessName.trim() || !documentFile}
                className="hover-snap flex h-12 w-full items-center justify-center rounded-md bg-primary text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Submitting for review…"
                  : isRejected
                    ? "Resubmit application"
                    : "Submit application"}
              </button>
              <p className="text-center text-xs leading-6 text-muted-foreground">
                After submission, start shaping private drafts while the audition is under review.
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function ReadOnlyApplication({
  profile,
  isApproved,
}: {
  profile: VendorProfile;
  isApproved: boolean;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <Link
        href="/vendor"
        className="mb-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3" />
        Back to vendor house
      </Link>

      <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="apply-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <Sparkle
          size="md"
          className="pointer-events-none absolute right-[12%] top-[18%] opacity-80 max-sm:hidden"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="animate-fade-up flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkle size="sm" animated={false} />
              Vendor House · Submission
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {isApproved ? (
                <>
                  You&apos;re in the{" "}
                  <span className="italic text-primary">cast</span>.
                </>
              ) : (
                <>
                  Under{" "}
                  <span className="italic text-primary">review</span>.
                </>
              )}
            </h1>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {isApproved
                ? "This page is read-only — your vendor house is approved. Publish your strongest pieces from inventory."
                : "This page is read-only while the team reviews the submission on file. Keep shaping private drafts."}
            </p>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-wrap gap-3">
            <div
              className={cn(
                "flex min-w-[8rem] flex-col gap-0.5 rounded-xl border px-4 py-3",
                isApproved
                  ? "border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20"
              )}
            >
              <span className="font-display text-2xl font-semibold text-foreground">
                {isApproved ? "Live" : "Queued"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {isApproved ? "Approved" : "Pending"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="animate-fade-up space-y-4 rounded-2xl border border-border bg-muted/30 p-6 lg:sticky lg:top-6 lg:self-start">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <Sparkle size="sm" animated={false} />
            Next cue
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {isApproved
              ? "Publish your strongest pieces."
              : "Prepare private drafts while you wait."}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            {isApproved
              ? "Head to inventory to publish and manage listings."
              : "Customers only see published active listings after approval."}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={isApproved ? "/vendor/inventory" : "/vendor"}
              className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
            >
              {isApproved ? "Manage inventory" : "Go to overview"}
            </Link>
            {!isApproved ? (
              <Link
                href="/vendor/inventory"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                Prepare drafts
              </Link>
            ) : null}
          </div>
        </aside>

        <section className="animate-fade-up-delay-1 rounded-2xl border border-border bg-card p-6 md:p-8">
          <VendorApplicationPreview profile={profile.profile} status={profile.vendorStatus} />
        </section>
      </div>
    </div>
  );
}
