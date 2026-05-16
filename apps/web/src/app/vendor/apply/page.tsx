"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, FileTextIcon, UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { VendorApplicationPreview } from "@/components/VendorApplicationPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { applyForVendor, getVendorProfile, type VendorProfile } from "@/lib/vendor";

function detailBlock(title: string, copy: string) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <p className="font-playfair text-2xl font-semibold text-foreground">{title}</p>
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
    if (!documentFile) return "Upload government ID or PDF";
    return `${documentFile.name} - ${(documentFile.size / 1024 / 1024).toFixed(2)} MB`;
  }, [documentFile]);

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-16 w-96 rounded-sm" />
          <Skeleton className="h-64 w-full rounded-sm" />
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
        ? "This page is now read-only because your vendor house has already been approved."
        : "This page is read-only while the team reviews the submission currently on file.";

    return (
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-16">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-8">
            <Link
              href="/vendor"
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3" />
              Back to vendor house
            </Link>

            <div className="space-y-5 border-b border-border pb-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Submitted Application
              </p>
              <h1 className="max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
                {heading}
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">{copy}</p>
            </div>

            <div className="rounded-sm border border-border bg-muted/30 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next step</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {profile.vendorStatus === "APPROVED"
                  ? "Head back to inventory to publish and manage listings."
                  : "You can prepare private drafts now and wait for approval before publishing anything live."}
              </p>
            </div>
          </section>

          <section className="border border-border bg-card p-6 md:p-8">
            <VendorApplicationPreview profile={profile.profile} status={profile.vendorStatus} />
          </section>
        </div>
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-16">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-8">
          <Link
            href="/vendor"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" />
            Back to vendor house
          </Link>

          <div className="space-y-5 border-b border-border pb-10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Vendor Application
            </p>
            <h1 className="max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Apply with trust, not friction.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              Share the story behind your collection, add a real identity document, and start preparing private drafts while the team reviews your boutique.
            </p>
          </div>

          <div className="space-y-4">
            {detailBlock(
              "Manual review",
              "Every application is reviewed by a human before any storefront can go live."
            )}
            {detailBlock(
              "Private drafts first",
              "You can start arranging inventory before approval, but customers will only see published active listings."
            )}
            {detailBlock(
              "Curated marketplace",
              "We optimize for trust, clarity, and a well-shaped marketplace rather than volume at any cost."
            )}
          </div>
        </section>

        <section className="border border-border bg-card p-6 md:p-8">
          <div className="border-b border-border pb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Boutique profile</p>
            <p className="mt-3 max-w-2xl font-playfair text-3xl font-semibold text-foreground">
              Tell us who you are and what kind of wardrobe you are bringing in.
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
                className="h-12 rounded-sm border-border bg-transparent text-base text-foreground shadow-none focus-visible:border-foreground/30 focus-visible:ring-0"
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
                className="w-full resize-y rounded-sm border border-border bg-transparent px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground/30"
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
                className="flex cursor-pointer flex-col gap-4 rounded-sm border border-dashed border-border bg-muted/30 px-5 py-6 transition-colors hover:bg-muted"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-foreground">
                    <UploadIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{documentLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Accepted formats: image files or PDF, up to 8MB.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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

            <div className="border-t border-border pt-6">
              <button
                type="submit"
                disabled={loading || !businessName.trim() || !documentFile}
                className="flex h-12 w-full items-center justify-center rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Submitting for review..." : "Submit application"}
              </button>
              <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
                After submission, you can start shaping private drafts while the application is under review.
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
