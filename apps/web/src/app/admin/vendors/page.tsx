"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  Cross2Icon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";

import {
  AdminEmptyState,
  AdminResponsiveFilterRail,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminApproveVendor,
  adminListAllVendors,
  adminListPendingVendors,
  adminRejectVendor,
  type PendingVendor,
} from "@/lib/admin";
import { resolveApiAsset } from "@/lib/assets";

const FILTERS = ["ALL", "APPROVED", "PENDING", "REJECTED"] as const;

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function vendorTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "success" as const;
  if (normalized === "PENDING") return "warning" as const;
  if (normalized === "REJECTED") return "danger" as const;
  return "neutral" as const;
}

function vendorPriority(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PENDING") return 0;
  if (normalized === "REJECTED") return 1;
  if (normalized === "APPROVED") return 2;
  return 3;
}

export default function AdminVendorsPage() {
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [allVendors, setAllVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<PendingVendor | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");

  useEffect(() => {
    Promise.all([adminListPendingVendors(), adminListAllVendors()])
      .then(([pending, all]) => {
        setPendingVendors(pending);
        setAllVendors(all);
      })
      .catch(() => toast.error("Failed to load vendor records."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const approved = allVendors.filter(
      (vendor) => vendor.status.toUpperCase() === "APPROVED"
    ).length;
    const rejected = allVendors.filter(
      (vendor) => vendor.status.toUpperCase() === "REJECTED"
    ).length;

    return {
      pending: pendingVendors.length,
      approved,
      rejected,
      total: allVendors.length,
    };
  }, [allVendors, pendingVendors.length]);

  const filteredVendors = useMemo(() => {
    const scopedVendors =
      filter === "ALL"
        ? allVendors
        : allVendors.filter((vendor) => vendor.status.toUpperCase() === filter);

    return [...scopedVendors].sort((left, right) => {
      const priorityDelta = vendorPriority(left.status) - vendorPriority(right.status);
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
    });
  }, [allVendors, filter]);

  async function reviewVendor(userId: number, action: "approve" | "reject") {
    setActioning(userId);
    try {
      if (action === "approve") {
        await adminApproveVendor(userId);
      } else {
        await adminRejectVendor(userId);
      }

      setPendingVendors((current) => current.filter((vendor) => vendor.user_id !== userId));
      const nextStatus = action === "approve" ? "APPROVED" : "REJECTED";
      setAllVendors((current) => {
        const existing = current.some((vendor) => vendor.user_id === userId);
        if (existing) {
          return current.map((vendor) =>
            vendor.user_id === userId ? { ...vendor, status: nextStatus } : vendor
          );
        }

        const pendingRecord = pendingVendors.find((vendor) => vendor.user_id === userId);
        return pendingRecord ? [{ ...pendingRecord, status: nextStatus }, ...current] : current;
      });
      setSelectedVendor((current) =>
        current?.user_id === userId ? { ...current, status: nextStatus } : current
      );

      toast.success(action === "approve" ? "Vendor approved." : "Vendor rejected.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Vendor review failed.");
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[360px] rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[360px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        eyebrow="Approval summary"
        title="Decide which vendor applications can go live"
        description="Start with pending applications, confirm identity evidence, and keep reviewed accounts easy to scan after a decision is made."
        actions={
          <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
            {metrics.total} vendor record{metrics.total === 1 ? "" : "s"}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Needs review
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.pending}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Applications still waiting for an approval or rejection decision.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Approved
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.approved}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Vendor accounts currently cleared to list and operate.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Rejected
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.rejected}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Applications previously declined after admin review.
            </p>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        eyebrow="Approval queue"
        title="Pending vendor applications"
        description="Each row shows who applied, when they applied, and whether identity proof is attached before you open the full review panel."
      >
        {pendingVendors.length === 0 ? (
          <AdminEmptyState
            title="No vendor applications are waiting."
            description="New submissions will appear here when a vendor finishes the application flow."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Vendor</th>
                  <th className="pb-3 font-medium">Applicant</th>
                  <th className="pb-3 font-medium">Key checks</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingVendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="py-4">
                      <p className="font-semibold text-foreground">
                        {vendor.store_name || vendor.business_name || `Vendor #${vendor.id}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {vendor.bio || "No business summary provided."}
                      </p>
                    </td>
                    <td className="py-4">
                      <p className="text-foreground">
                        {vendor.User?.name || `User #${vendor.user_id}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {vendor.User?.email || "--"}
                      </p>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <p className="text-foreground">Applied {formatDate(vendor.created_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.id_document_url ? "ID document attached" : "No ID document attached"}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-2">
                        <AdminStatusBadge label={vendor.status} tone={vendorTone(vendor.status)} />
                        <p className="text-xs text-muted-foreground">
                          Waiting for approval or rejection.
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedVendor(vendor)}
                        >
                          <EyeOpenIcon className="size-4" />
                          Review
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actioning === vendor.user_id}
                          onClick={() => void reviewVendor(vendor.user_id, "approve")}
                        >
                          <CheckIcon className="size-4" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={actioning === vendor.user_id}
                          onClick={() => void reviewVendor(vendor.user_id, "reject")}
                        >
                          <Cross2Icon className="size-4" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        eyebrow="Vendor directory"
        title="Vendor account directory"
        description="Use this directory to check the current state of every vendor account after the application has already been reviewed."
        actions={
          <AdminResponsiveFilterRail
            label="Status"
            value={filter}
            options={FILTERS.map((status) => ({
              value: status,
              label: status === "ALL" ? "All" : status,
            }))}
            onChange={(value) => setFilter(value as (typeof FILTERS)[number])}
          />
        }
      >
        {filteredVendors.length === 0 ? (
          <AdminEmptyState
            title="No vendor records match this filter."
            description="Change the current state filter to review another slice of vendor accounts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Vendor</th>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">History</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="py-4">
                      <p className="font-semibold text-foreground">
                        {vendor.store_name || vendor.business_name || `Vendor #${vendor.id}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">User #{vendor.user_id}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-foreground">{vendor.User?.name || "--"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {vendor.User?.email || "--"}
                      </p>
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        <p className="text-foreground">Created {formatDate(vendor.created_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.review_note || "No review note saved."}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="space-y-2">
                        <AdminStatusBadge label={vendor.status} tone={vendorTone(vendor.status)} />
                        <p className="text-xs text-muted-foreground">
                          {vendor.status.toUpperCase() === "APPROVED"
                            ? "Can publish and operate on the marketplace."
                            : vendor.status.toUpperCase() === "REJECTED"
                              ? "Application was declined after review."
                              : "Application is still waiting on a decision."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>

      <Dialog
        open={selectedVendor !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedVendor(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          {selectedVendor ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedVendor.store_name ||
                    selectedVendor.business_name ||
                    `Vendor #${selectedVendor.id}`}
                </DialogTitle>
                <DialogDescription>
                  Review the applicant, business summary, and ID document before making a final approval decision.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Applicant
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {selectedVendor.User?.name || `User #${selectedVendor.user_id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedVendor.User?.email || "--"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Applied {formatDate(selectedVendor.created_at)}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Current state
                  </p>
                  <div className="mt-2">
                    <AdminStatusBadge
                      label={selectedVendor.status}
                      tone={vendorTone(selectedVendor.status)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedVendor.review_note || "No admin review note has been saved."}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Identity proof
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedVendor.id_document_url ? "Available" : "Missing"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedVendor.id_document_url
                      ? "Open the attached ID document to verify identity details."
                      : "No ID document is attached to this application."}
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Business summary
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selectedVendor.bio || "No business summary was provided with this application."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedVendor.id_document_url ? (
                  <a
                    href={resolveApiAsset(selectedVendor.id_document_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Open ID document
                  </a>
                ) : null}
                {selectedVendor.status.toUpperCase() === "PENDING" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actioning === selectedVendor.user_id}
                      onClick={() => void reviewVendor(selectedVendor.user_id, "approve")}
                    >
                      <CheckIcon className="size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={actioning === selectedVendor.user_id}
                      onClick={() => void reviewVendor(selectedVendor.user_id, "reject")}
                    >
                      <Cross2Icon className="size-4" />
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
