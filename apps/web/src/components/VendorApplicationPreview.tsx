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
import { Badge } from "@/components/ui/badge";

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
    return "This is the application that unlocked the vendor workspace currently in use.";
  }

  if (status === "REJECTED") {
    return "This is the most recent submission on file before the account was sent back for revision.";
  }

  if (status === "PENDING") {
    return "This is the information currently waiting in the manual review queue.";
  }

  return "No vendor submission is currently on file for this account.";
}

function statusClass(status: VendorStatus) {
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

export function VendorApplicationPreview({
  profile,
  status,
}: {
  profile: VendorProfileData | null;
  status: VendorStatus;
}) {
  if (!profile) {
    return (
      <div className="surface-panel rounded-[var(--radius-xl)] p-6">
        <p className="text-xl font-semibold text-foreground">No submission found.</p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          We could not find a vendor submission on file for this account yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface-shell rounded-[var(--radius-xl)] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={statusClass(status)}>
            {status}
          </Badge>
          <p className="text-sm text-muted-foreground">{statusCopy(status)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface-panel rounded-[var(--radius-xl)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Business name
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {profile.business_name || "Not provided"}
          </p>
        </div>

        <div className="surface-panel rounded-[var(--radius-xl)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Timeline
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-foreground">Submitted {formatDate(profile.created_at)}</p>
            <p className="text-muted-foreground">
              Last reviewed {formatDate(profile.reviewed_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="surface-panel rounded-[var(--radius-xl)] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Boutique story
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {profile.bio || "No boutique story was included in this submission."}
        </p>
      </div>

      <div className="surface-panel rounded-[var(--radius-xl)] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Identity document
        </p>
        {profile.id_document_url ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={resolveApiAsset(profile.id_document_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-accent"
            >
              Open document
            </a>
            <p className="text-xs text-muted-foreground">
              Stored only for manual review and trust verification.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No document is available on file.</p>
        )}
      </div>

      {profile.review_note ? (
        <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-destructive">
            Review note
          </p>
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="border-b border-border pb-5">
          <DialogTitle>Submitted application</DialogTitle>
          <DialogDescription>
            Review the exact vendor information currently on file before resubmitting or waiting
            for approval.
          </DialogDescription>
        </DialogHeader>
        <VendorApplicationPreview profile={profile} status={status} />
      </DialogContent>
    </Dialog>
  );
}
