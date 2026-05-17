"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
  adminListReservations,
  adminUpdateReservationStatus,
  type AdminReservation,
} from "@/lib/admin";

const FILTERS = [
  "ALL",
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "DISPUTED",
] as const;

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

function reservationTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "COMPLETED" || normalized === "APPROVED") return "success" as const;
  if (normalized === "PENDING") return "warning" as const;
  if (normalized === "DISPUTED" || normalized === "REJECTED" || normalized === "CANCELLED") {
    return "danger" as const;
  }
  return "neutral" as const;
}

function reservationPriority(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "DISPUTED") return 0;
  if (normalized === "PENDING") return 1;
  if (normalized === "REJECTED" || normalized === "CANCELLED") return 2;
  if (normalized === "APPROVED") return 3;
  if (normalized === "COMPLETED") return 4;
  return 5;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [actioning, setActioning] = useState<number | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);

  useEffect(() => {
    adminListReservations()
      .then((data) => setReservations(data))
      .catch(() => toast.error("Failed to load reservations."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const pending = reservations.filter(
      (reservation) => reservation.status.toUpperCase() === "PENDING"
    ).length;
    const active = reservations.filter((reservation) =>
      ["APPROVED", "COMPLETED"].includes(reservation.status.toUpperCase())
    ).length;
    const exceptions = reservations.filter((reservation) =>
      ["DISPUTED", "REJECTED", "CANCELLED"].includes(reservation.status.toUpperCase())
    ).length;

    return {
      total: reservations.length,
      pending,
      active,
      exceptions,
    };
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const scopedReservations =
      filter === "ALL"
        ? reservations
        : reservations.filter((reservation) => reservation.status.toUpperCase() === filter);

    return [...scopedReservations].sort((left, right) => {
      const priorityDelta =
        reservationPriority(left.status) - reservationPriority(right.status);
      if (priorityDelta !== 0) return priorityDelta;
      return (
        new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime()
      );
    });
  }, [filter, reservations]);

  async function updateStatus(id: number, status: string) {
    setActioning(id);
    try {
      await adminUpdateReservationStatus(id, status);
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id ? { ...reservation, status } : reservation
        )
      );
      setSelectedReservation((current) =>
        current?.id === id ? { ...current, status } : current
      );
      toast.success(`Reservation marked as ${status.toLowerCase()}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update reservation.");
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
        eyebrow="Reservation priorities"
        title="Keep the booking queue easy to judge"
        description="Handle disputes and pending bookings first, then use the broader reservation list for follow-through and audit."
        actions={
          <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
            {metrics.total} reservation{metrics.total === 1 ? "" : "s"}
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
              Bookings still waiting for resolution or approval.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Exceptions
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.exceptions}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Disputed, rejected, or cancelled reservations needing oversight.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Moving cleanly
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.active}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Reservations already approved or completed without escalation.
            </p>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        eyebrow="Reservation operations"
        title="Review bookings without opening every record"
        description="Filter by lifecycle state, scan the key booking facts in one row, and open the detail panel only when a decision needs context."
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
        {filteredReservations.length === 0 ? (
          <AdminEmptyState
            title="No reservations match this filter."
            description="Change the current slice to review another group of reservation records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Reservation</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Booking window</th>
                  <th className="pb-3 font-medium">Signals</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReservations.map((reservation) => {
                  const itemSummary = reservation.items?.length
                    ? reservation.items
                        .slice(0, 2)
                        .map(
                          (item) =>
                            `${item.Costume?.name || `Costume #${item.costume_id}`} x${item.quantity || 1}`
                        )
                        .join(", ")
                    : "No item detail returned";

                  return (
                    <tr key={reservation.id}>
                      <td className="py-4">
                        <p className="font-semibold text-foreground">Reservation #{reservation.id}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Created {formatDate(reservation.created_at)}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-foreground">
                          {reservation.User?.name || `User #${reservation.user_id}`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reservation.User?.email || "--"}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-foreground">
                          {formatDate(reservation.start_date)} to {formatDate(reservation.end_date)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reservation.items?.length || 0} item
                          {reservation.items?.length === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-foreground">{currency(reservation.total_price)}</p>
                          <p className="text-xs text-muted-foreground">{itemSummary}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <AdminStatusBadge
                            label={reservation.status}
                            tone={reservationTone(reservation.status)}
                          />
                          {reservation.status.toUpperCase() === "DISPUTED" ? (
                            <p className="text-xs text-muted-foreground">
                              Escalated booking requiring closer review.
                            </p>
                          ) : reservation.status.toUpperCase() === "PENDING" ? (
                            <p className="text-xs text-muted-foreground">
                              Waiting for approval or next action.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Status already reflects a clear outcome.
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReservation(reservation)}
                        >
                          <EyeOpenIcon className="size-4" />
                          Review
                        </Button>
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
        open={selectedReservation !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedReservation(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          {selectedReservation ? (
            <>
              <DialogHeader>
                <DialogTitle>Reservation #{selectedReservation.id}</DialogTitle>
                <DialogDescription>
                  Review booking context and apply an override only when the reservation needs intervention.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Customer
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {selectedReservation.User?.name || `User #${selectedReservation.user_id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedReservation.User?.email || "--"}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Booking window
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDate(selectedReservation.start_date)} to{" "}
                    {formatDate(selectedReservation.end_date)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Created {formatDate(selectedReservation.created_at)}
                  </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Current status
                  </p>
                  <div className="mt-2">
                    <AdminStatusBadge
                      label={selectedReservation.status}
                      tone={reservationTone(selectedReservation.status)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Total {currency(selectedReservation.total_price)}
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Reserved items
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Use the line items below to confirm quantities and pricing before changing the booking state.
                    </p>
                  </div>
                  <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
                    {selectedReservation.items?.length || 0} item
                    {selectedReservation.items?.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedReservation.items?.length ? (
                    selectedReservation.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.Costume?.name || `Costume #${item.costume_id}`}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Quantity {item.quantity || 1}
                          </p>
                        </div>
                        <p className="text-sm text-foreground">
                          {item.subtotal ? currency(item.subtotal) : "--"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No item detail was returned for this reservation.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {["APPROVED", "COMPLETED", "DISPUTED", "CANCELLED", "REJECTED"].map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={
                      status === "REJECTED" || status === "CANCELLED"
                        ? "destructive"
                        : "outline"
                    }
                    disabled={
                      actioning === selectedReservation.id ||
                      selectedReservation.status === status
                    }
                    onClick={() => void updateStatus(selectedReservation.id, status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
