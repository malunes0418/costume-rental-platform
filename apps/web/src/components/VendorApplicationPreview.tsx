"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveApiAsset } from "@/lib/assets";
import { type VendorProfileData, type VendorStatus } from "@/lib/vendor";

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusCopy(status: VendorStatus) {
  if (status === "APPROVED") {
    return "This is the application that was approved for your vendor account.";
  }

  if (status === "REJECTED") {
    return "This is the most recent submission on file for your vendor account.";
  }

  return "This is the information currently on file for manual review.";
}

export function VendorApplicationPreview({
  profile,
  status,
}: {
  profile: VendorProfileData | null;
  status: VendorStatus;
}) {
  if (!profile) {
    return (
      <div className="rounded-sm border border-border bg-card p-5">
        <p className="font-playfair text-2xl font-semibold text-foreground">No submission found.</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          We could not find a vendor submission on file for this account yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-border bg-muted/30 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Application status</p>
        <p className="mt-3 font-playfair text-3xl font-semibold text-foreground">{status}</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{statusCopy(status)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Business name</p>
          <p className="mt-3 font-playfair text-2xl font-semibold text-foreground">
            {profile.business_name || "Not provided"}
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Submitted</p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-foreground">
            {formatDate(profile.created_at)}
          </p>
          {profile.reviewed_at ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Last reviewed {formatDate(profile.reviewed_at)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Boutique story</p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {profile.bio || "No boutique story was included in this submission."}
        </p>
      </div>

      <div className="rounded-sm border border-border bg-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Identity document</p>
        {profile.id_document_url ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={resolveApiAsset(profile.id_document_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              Open document
            </a>
            <p className="text-xs text-muted-foreground">Submitted for manual review.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No document is available on file.</p>
        )}
      </div>

      {profile.review_note ? (
        <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-destructive">Review note</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{profile.review_note}</p>
        </div>
      ) : null}
    </div>
  );
}

export function VendorApplicationPreviewDialog({
  open,
  onOpenChange,
  profile,
  status,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: VendorProfileData | null;
  status: VendorStatus;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-background p-0 shadow-none">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle className="font-playfair text-3xl font-semibold text-foreground">
            Submitted application
          </DialogTitle>
          <DialogDescription className="text-sm leading-7 text-muted-foreground">
            Review the exact vendor information currently on file.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-6">
          <VendorApplicationPreview profile={profile} status={status} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
