"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListReservations, adminUpdateReservationStatus, type AdminReservation } from "@/lib/admin";
import { getReservationItemPricingSummary } from "@/lib/pricing";
import {
  ACTIVE_VENDOR_EARNING_STATUSES,
  PAYMENT_PURPOSE_LABELS,
  getReservationStatusMeta,
  RESERVATION_STATUS_OPTIONS,
  type ReservationStatus,
} from "@/lib/reservationStatus";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { FULFILLMENT_METHOD_LABELS, formatLocationSummary } from "@/lib/fulfillment";

const NEXT_ADMIN_STATUSES: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
  CART: ["PENDING_PAYMENT"],
  PENDING_PAYMENT: ["PENDING_VENDOR_REVIEW"],
  PENDING_VENDOR_REVIEW: ["CONFIRMED", "AWAITING_SURCHARGE_PAYMENT", "REJECTED_BY_VENDOR"],
  AWAITING_SURCHARGE_PAYMENT: ["CONFIRMED"],
  CONFIRMED: ["OUTBOUND_SCHEDULED"],
  OUTBOUND_SCHEDULED: ["OUTBOUND_IN_PROGRESS"],
  OUTBOUND_IN_PROGRESS: ["WITH_RENTER"],
  WITH_RENTER: ["RETURN_SCHEDULED"],
  RETURN_SCHEDULED: ["RETURN_IN_PROGRESS"],
  RETURN_IN_PROGRESS: ["RETURNED"],
  RETURNED: ["COMPLETED"]
};

function fmt(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusChip({ status }: { status: ReservationStatus }) {
  const meta = getReservationStatusMeta(status);
  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${meta.className}`}>
      {meta.label}
    </span>
  );
}

const STATUSES: Array<"" | ReservationStatus> = ["", ...RESERVATION_STATUS_OPTIONS];

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const [all, setAll] = useState<AdminReservation[]>([]);
  const [filter, setFilter] = useState<"" | ReservationStatus>("");
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState<AdminReservation | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    adminListReservations()
      .then((value) => setAll(Array.isArray(value) ? value : (value as never as { data?: AdminReservation[] })?.data || []))
      .catch(() => toast.error("Failed to load reservations."))
      .finally(() => setLoading(false));
  }, [user]);

  const items = filter ? all.filter((reservation) => reservation.status === filter) : all;
  const trackedStatuses = new Set<ReservationStatus>([
    "PENDING_VENDOR_REVIEW",
    "AWAITING_SURCHARGE_PAYMENT",
    ...ACTIVE_VENDOR_EARNING_STATUSES,
    "COMPLETED"
  ]);
  const totalTrackedValue = all
    .filter((reservation) => trackedStatuses.has(reservation.status))
    .reduce((sum, reservation) => sum + Number(reservation.total_price), 0);

  async function handleUpdateStatus(id: number, newStatus: ReservationStatus) {
    if (!user) return;
    setActioning(true);
    try {
      await adminUpdateReservationStatus(id, newStatus);
      setAll((current) => current.map((reservation) => (reservation.id === id ? { ...reservation, status: newStatus } : reservation)));
      if (selectedRes?.id === id) {
        setSelectedRes({ ...selectedRes, status: newStatus });
      }
      toast.success(`Reservation status updated to ${getReservationStatusMeta(newStatus).label}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update reservation status.");
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Reservations
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {all.length} total · ₱{Number(totalTrackedValue).toLocaleString()} active lifecycle value
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status || "all"}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors",
                filter === status
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {status ? getReservationStatusMeta(status).label : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {items.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">
              No reservations match this filter.
            </p>
          )}

          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Reservation</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Costume Details</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((reservation) => {
                const costume = reservation.items?.[0]?.Costume;
                return (
                  <tr key={reservation.id} className="group transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-playfair text-base font-semibold text-foreground">#{reservation.id}</p>
                      <StatusChip status={reservation.status} />
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{reservation.User?.name || "Unknown"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{reservation.User?.email || `User #${reservation.user_id}`}</p>
                    </td>
                    <td className="p-4">
                      <p className="max-w-[200px] truncate font-semibold text-foreground">
                        {costume?.name || "Multiple items"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {reservation.items?.length || 0} item{(reservation.items?.length || 0) === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {fmt(reservation.start_date)} →<br />
                      {fmt(reservation.end_date)}
                    </td>
                    <td className="p-4 font-playfair font-semibold text-foreground">
                      ₱{Number(reservation.total_price).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRes(reservation)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MagnifyingGlassIcon className="size-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="divide-y divide-border md:hidden">
            {items.map((reservation) => (
              <div key={reservation.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-playfair text-base font-semibold text-foreground">#{reservation.id}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{reservation.User?.name || `User #${reservation.user_id}`}</p>
                  </div>
                  <div className="text-right">
                    <StatusChip status={reservation.status} />
                    <p className="mt-1 font-playfair font-semibold text-foreground">₱{Number(reservation.total_price).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRes(reservation)}
                  className="flex h-8 w-full items-center justify-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted"
                >
                  <MagnifyingGlassIcon className="size-3.5" /> View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedRes} onOpenChange={(open: boolean) => !open && setSelectedRes(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">Reservation #{selectedRes?.id}</DialogTitle>
            <DialogDescription>
              View detailed information and moderate this reservation lifecycle.
            </DialogDescription>
          </DialogHeader>

          {selectedRes && (
            <div className="mt-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{selectedRes.User?.name || `User #${selectedRes.user_id}`}</p>
                  <p className="text-xs text-muted-foreground">{selectedRes.User?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                  <div className="pt-1">
                    <StatusChip status={selectedRes.status} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rental Period</p>
                  <p className="text-sm">{fmt(selectedRes.start_date)} to {fmt(selectedRes.end_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Price</p>
                  <p className="font-playfair text-lg font-semibold">₱{Number(selectedRes.total_price).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-sm border border-border bg-muted/20 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Costume Details</p>
                <div className="space-y-2">
                  {selectedRes.items?.map((item, index) => {
                    const pricingSummary = getReservationItemPricingSummary(item);
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="font-medium">{item.Costume?.name || `Item #${item.costume_id}`}</span>
                        <span className="text-muted-foreground">
                          PHP {pricingSummary.amount.toLocaleString()} {pricingSummary.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRes.fulfillment ? (
                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fulfillment</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {FULFILLMENT_METHOD_LABELS[selectedRes.fulfillment.outbound_method]} outbound
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {selectedRes.fulfillment.outbound_method === "DELIVERY"
                          ? formatLocationSummary(selectedRes.fulfillment.outbound_location_snapshot)
                          : "Vendor collection point"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {FULFILLMENT_METHOD_LABELS[selectedRes.fulfillment.return_method]} return
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {selectedRes.fulfillment.return_method === "DELIVERY"
                          ? formatLocationSummary(selectedRes.fulfillment.return_location_snapshot)
                          : "Vendor collection point"}
                      </p>
                    </div>
                  </div>
                  {selectedRes.fulfillment.vendor_approval_note ? (
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Note: {selectedRes.fulfillment.vendor_approval_note}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {selectedRes.adjustments?.length || selectedRes.payments?.length ? (
                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Financial Activity</p>
                  <div className="space-y-3">
                    {selectedRes.adjustments?.map((adjustment) => (
                      <div key={adjustment.id} className="rounded-sm border border-border bg-background px-4 py-3 text-sm">
                        <p className="font-semibold text-foreground">
                          Outside-area surcharge · ₱{Number(adjustment.amount).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                          {adjustment.status}
                        </p>
                        {adjustment.note ? (
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">{adjustment.note}</p>
                        ) : null}
                      </div>
                    ))}
                    {selectedRes.payments?.map((payment) => (
                      <div key={payment.id} className="rounded-sm border border-border bg-background px-4 py-3 text-sm">
                        <p className="font-semibold text-foreground">
                          Payment #{payment.id} · ₱{Number(payment.amount).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                          {PAYMENT_PURPOSE_LABELS[payment.payment_purpose]} · {payment.status}
                        </p>
                        {payment.reservationAdjustment?.note ? (
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">{payment.reservationAdjustment.note}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <ExclamationTriangleIcon className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-widest">Admin Lifecycle Controls</p>
                </div>
                {(NEXT_ADMIN_STATUSES[selectedRes.status] || []).length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {(NEXT_ADMIN_STATUSES[selectedRes.status] || []).map((nextStatus) => {
                        const meta = getReservationStatusMeta(nextStatus);
                        return (
                          <button
                            key={nextStatus}
                            onClick={() => handleUpdateStatus(selectedRes.id, nextStatus)}
                            disabled={actioning}
                            className="flex h-9 items-center rounded-sm border border-foreground/20 px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                          >
                            Mark {meta.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Admin controls respect the same guarded lifecycle transitions used by vendor and renter workflows.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This reservation is in a terminal state and has no further legal lifecycle transitions.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
