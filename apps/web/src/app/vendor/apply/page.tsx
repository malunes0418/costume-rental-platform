"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, FileTextIcon, UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { VendorApplicationPreview } from "@/components/VendorApplicationPreview";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { applyForVendor, getVendorProfile, type VendorProfile } from "@/lib/vendor";

function DetailBlock({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="surface-panel rounded-[var(--radius-xl)] p-5">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy}</p>
    </div>
  );
}

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
    if (!documentFile) return "Upload a government ID or PDF";
    return `${documentFile.name} - ${(documentFile.size / 1024 / 1024).toFixed(2)} MB`;
  }, [documentFile]);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Skeleton className="h-[620px] rounded-[var(--radius-xl)]" />
          <Skeleton className="h-[620px] rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  if (profile?.vendorStatus === "PENDING" || profile?.vendorStatus === "APPROVED") {
    const heading =
      profile.vendorStatus === "APPROVED"
        ? "Your application is already approved."
        : "Your application is already under review.";
    const copy =
      profile.vendorStatus === "APPROVED"
        ? "This form is now read-only because the vendor workspace is already unlocked."
        : "This form is read-only while the current submission is waiting in manual review.";

    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
          <Link
            href="/vendor"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" />
            Back to vendor overview
          </Link>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Vendor application
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {copy}
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <DetailBlock
              title="What changes next"
              copy={
                profile.vendorStatus === "APPROVED"
                  ? "Head to inventory and keep the collection disciplined: clean imagery, clear pricing, and deliberate publishing."
                  : "Use the waiting period to strengthen private drafts instead of waiting passively on approval."
              }
            />
            <DetailBlock
              title="Why the gate stays manual"
              copy="Identity review, boutique clarity, and marketplace trust all matter more than removing every approval step."
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/vendor" className={buttonVariants({ variant: "brand" })}>
              Back to overview
            </Link>
            <Link href="/vendor/inventory" className={buttonVariants({ variant: "outline" })}>
              Go to inventory
            </Link>
          </div>
        </section>

        <aside className="surface-panel rounded-[var(--radius-xl)] p-6">
          <VendorApplicationPreview profile={profile.profile} status={profile.vendorStatus} />
        </aside>
      </div>
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <Link
          href="/vendor"
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          Back to vendor overview
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Vendor application
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            Apply with trust, clarity, and enough structure to move fast.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Share the boutique story, provide one identity document, and unlock draft-building once
            the account enters manual review.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <DetailBlock
            title="Manual review"
            copy="Every vendor account is checked by a human before the storefront can go live."
          />
          <DetailBlock
            title="Drafts first"
            copy="You can build the collection while approval is pending, but only approved houses can publish."
          />
          <DetailBlock
            title="Marketplace quality"
            copy="The goal is a cleaner renter experience with stronger vendor trust signals."
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label
                htmlFor="business-name"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Business name
              </Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Maison Masquerade"
                required
                className="h-12 rounded-[var(--radius-md)] bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="business-bio"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Boutique story
              </Label>
              <textarea
                id="business-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={7}
                placeholder="Describe the collection, the quality standard, and the kind of renter or event this wardrobe is designed for."
                className="w-full resize-y rounded-[var(--radius-md)] border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-ring/60 focus:ring-4 focus:ring-ring/14"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="id-document"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Identity document
              </Label>
              <label
                htmlFor="id-document"
                className="flex cursor-pointer flex-col gap-4 rounded-[var(--radius-lg)] border border-dashed border-[color:color-mix(in_oklab,var(--color-brand)_24%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_5%,var(--color-background))] px-5 py-6 transition-colors hover:bg-[color:color-mix(in_oklab,var(--color-brand)_9%,var(--color-background))]"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-foreground">
                    <UploadIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{documentLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Accepted formats: image files or PDF, up to 8MB.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <FileTextIcon className="size-3.5" />
                  Used only for manual review
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
          </div>

          <div className="border-t border-border pt-6">
            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={loading || !businessName.trim() || !documentFile}
              className="w-full"
            >
              {loading ? "Submitting for review..." : "Submit application"}
            </Button>
            <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
              After submission, inventory opens for draft preparation while the application is under
              review.
            </p>
          </div>
        </form>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="surface-panel rounded-[var(--radius-xl)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Preview
          </p>
          <p className="mt-3 text-xl font-semibold text-foreground">Submission snapshot</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This preview uses the current information on file, not unsaved edits in the form.
          </p>
        </div>

        <div className="surface-panel rounded-[var(--radius-xl)] p-6">
          <VendorApplicationPreview profile={profile?.profile ?? null} status={profile?.vendorStatus ?? "NONE"} />
        </div>
      </aside>
    </div>
  );
}
