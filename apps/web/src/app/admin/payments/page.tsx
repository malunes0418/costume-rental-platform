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
import { adminListPayments, adminReviewPayment, type AdminPayment } from "@/lib/admin";
import { resolveApiAsset } from "@/lib/assets";

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function currency(value: number | string) {
  return `PHP ${Number(value).toLocaleString()}`;
}

function paymentTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "success" as const;
  if (normalized === "PENDING") return "warning" as const;
  if (normalized === "REJECTED") return "danger" as const;
  return "neutral" as const;
}

function paymentPriority(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PENDING") return 0;
  if (normalized === "REJECTED") return 1;
  if (normalized === "APPROVED") return 2;
  return 3;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [actioning, setActioning] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  useEffect(() => {
    adminListPayments()
      .then((data) => setPayments(data))
      .catch(() => toast.error("Failed to load payments."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const approved = payments.filter((payment) => payment.status.toUpperCase() === "APPROVED");
    const pending = payments.filter((payment) => payment.status.toUpperCase() === "PENDING");
    const rejected = payments.filter((payment) => payment.status.toUpperCase() === "REJECTED");

    return {
      total: payments.length,
      approvedAmount: approved.reduce((sum, payment) => sum + Number(payment.amount), 0),
      pending: pending.length,
      rejected: rejected.length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const scopedPayments =
      filter === "ALL"
        ? payments
        : payments.filter((payment) => payment.status.toUpperCase() === filter);

    return [...scopedPayments].sort((left, right) => {
      const priorityDelta = paymentPriority(left.status) - paymentPriority(right.status);
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
    });
  }, [filter, payments]);

  async function reviewPayment(paymentId: number, status: "APPROVED" | "REJECTED") {
    setActioning(paymentId);
    try {
      await adminReviewPayment(paymentId, status, "");
      setPayments((current) =>
        current.map((payment) => (payment.id === paymentId ? { ...payment, status } : payment))
      );
      setSelectedPayment((current) =>
        current?.id === paymentId ? { ...current, status } : current
      );
      toast.success(`Payment ${status.toLowerCase()}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Payment review failed.");
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[560px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        eyebrow="Payment priorities"
        title="Review receipts before they slow the booking flow"
        description="Handle pending payment proofs first, keep rejected submissions easy to revisit, and track approved volume without turning the page into a finance dashboard."
        actions={
          <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
            {metrics.total} payment{metrics.total === 1 ? "" : "s"}
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
              Payment proofs still waiting for an approval or rejection.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Approved volume
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {currency(metrics.approvedAmount)}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Payment value that has already cleared review.
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
              Submissions previously declined after review.
            </p>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        eyebrow="Payment moderation"
        title="Scan evidence and decide quickly"
        description="Filter by review state, check the amount and linked reservations in one row, and open the receipt panel only when you need closer verification."
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
        {filteredPayments.length === 0 ? (
          <AdminEmptyState
            title="No payments match this filter."
            description="Change the current state filter to review another slice of payment records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Payer</th>
                  <th className="pb-3 font-medium">Reservations</th>
                  <th className="pb-3 font-medium">Signals</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((payment) => {
                  const reservationLabel = (payment.reservation_ids || []).length
                    ? payment.reservation_ids.map((id) => `#${id}`).join(", ")
                    : "--";

                  return (
                    <tr key={payment.id}>
                      <td className="py-4">
                        <p className="font-semibold text-foreground">Payment #{payment.id}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted {formatDate(payment.created_at)}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-foreground">User #{payment.user_id}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {payment.proof_url ? "Receipt attached" : "No receipt attached"}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-foreground">{reservationLabel}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(payment.reservation_ids || []).length} linked reservation
                          {(payment.reservation_ids || []).length === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-foreground">{currency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.notes || "No admin note attached."}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <AdminStatusBadge label={payment.status} tone={paymentTone(payment.status)} />
                          {payment.status.toUpperCase() === "PENDING" ? (
                            <p className="text-xs text-muted-foreground">
                              Waiting for a final receipt decision.
                            </p>
                          ) : payment.status.toUpperCase() === "REJECTED" ? (
                            <p className="text-xs text-muted-foreground">
                              Previously declined after review.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Review is already complete for this submission.
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <EyeOpenIcon className="size-4" />
                            Review
                          </Button>
                          {payment.status.toUpperCase() === "PENDING" ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={actioning === payment.id}
                                onClick={() => void reviewPayment(payment.id, "APPROVED")}
                              >
                                <CheckIcon className="size-4" />
                                Approve
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={actioning === payment.id}
                                onClick={() => void reviewPayment(payment.id, "REJECTED")}
                              >
                                <Cross2Icon className="size-4" />
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>

      <Dialog
        open={selectedPayment !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedPayment(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedPayment ? (
            <>
              <DialogHeader>
                <DialogTitle>Payment #{selectedPayment.id}</DialogTitle>
                <DialogDescription>
                  Confirm the payment amount, linked reservations, and receipt proof before making a final review decision.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Submission
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {currency(selectedPayment.amount)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">User #{selectedPayment.user_id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Submitted {formatDate(selectedPayment.created_at)}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Current status
                  </p>
                  <div className="mt-2">
                    <AdminStatusBadge
                      label={selectedPayment.status}
                      tone={paymentTone(selectedPayment.status)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {(selectedPayment.reservation_ids || []).length} linked reservation
                    {(selectedPayment.reservation_ids || []).length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Receipt proof
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedPayment.proof_url ? "Available" : "Missing"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedPayment.proof_url
                      ? "Open the uploaded proof for full-size verification."
                      : "No proof file is attached to this payment record."}
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Linked reservations
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {(selectedPayment.reservation_ids || []).map((id) => `#${id}`).join(", ") || "--"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedPayment.notes || "No admin note attached."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedPayment.proof_url ? (
                  <a
                    href={resolveApiAsset(selectedPayment.proof_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Open receipt
                  </a>
                ) : null}
                {selectedPayment.status.toUpperCase() === "PENDING" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={actioning === selectedPayment.id}
                      onClick={() => void reviewPayment(selectedPayment.id, "APPROVED")}
                    >
                      <CheckIcon className="size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={actioning === selectedPayment.id}
                      onClick={() => void reviewPayment(selectedPayment.id, "REJECTED")}
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
