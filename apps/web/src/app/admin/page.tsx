"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArchiveIcon,
  CalendarIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

import {
  AdminEmptyState,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminListPayments,
  adminListPendingVendors,
  adminListReservations,
  adminListUsers,
  type AdminPayment,
  type AdminReservation,
  type AdminUser,
  type PendingVendor,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function currency(value: number | string) {
  return `PHP ${Number(value).toLocaleString()}`;
}

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  amount?: string;
  date?: string;
  tone: "success" | "warning" | "danger" | "neutral";
  status: string;
  href: string;
};

type QueueItem = {
  label: string;
  value: number;
  detail: string;
  href: string;
  cta: string;
  icon: typeof PersonIcon;
  tone: "success" | "warning" | "danger";
};

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminListUsers(),
      adminListReservations(),
      adminListPayments(),
      adminListPendingVendors(),
    ])
      .then(([userData, reservationData, paymentData, vendorData]) => {
        setUsers(userData);
        setReservations(reservationData);
        setPayments(paymentData);
        setPendingVendors(vendorData);
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const approvedPayments = payments.filter((payment) => payment.status === "APPROVED");
    const pendingPayments = payments.filter((payment) => payment.status === "PENDING");
    const disputedReservations = reservations.filter((reservation) =>
      ["DISPUTED", "REJECTED", "CANCELLED"].includes(reservation.status.toUpperCase())
    );
    const approvedReservations = reservations.filter((reservation) =>
      ["APPROVED", "COMPLETED"].includes(reservation.status.toUpperCase())
    );

    return {
      totalRevenue: approvedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      pendingPayments: pendingPayments.length,
      pendingVendors: pendingVendors.length,
      disputedReservations: disputedReservations.length,
      reservationsNeedingAttention: reservations.filter((reservation) =>
        ["PENDING", "DISPUTED"].includes(reservation.status.toUpperCase())
      ).length,
      approvedReservations: approvedReservations.length,
    };
  }, [payments, pendingVendors.length, reservations]);
  const reviewedPayments = useMemo(
    () => payments.filter((payment) => payment.status !== "PENDING").length,
    [payments]
  );
  const openQueueCount = useMemo(
    () =>
      metrics.pendingVendors + metrics.pendingPayments + metrics.reservationsNeedingAttention,
    [metrics.pendingPayments, metrics.pendingVendors, metrics.reservationsNeedingAttention]
  );
  const queueItems = useMemo<QueueItem[]>(
    () => [
      {
        label: "Vendor applications",
        value: metrics.pendingVendors,
        detail: "New storefronts waiting for approval or rejection.",
        href: "/admin/vendors",
        cta: "Review vendors",
        icon: PersonIcon,
        tone: metrics.pendingVendors > 0 ? "warning" : "success",
      },
      {
        label: "Payment proofs",
        value: metrics.pendingPayments,
        detail: "Receipts still waiting for a payment decision.",
        href: "/admin/payments",
        cta: "Review payments",
        icon: ArchiveIcon,
        tone: metrics.pendingPayments > 0 ? "warning" : "success",
      },
      {
        label: "Reservation issues",
        value: metrics.reservationsNeedingAttention,
        detail: "Pending or disputed reservations that may block fulfillment.",
        href: "/admin/reservations",
        cta: "Review reservations",
        icon: CalendarIcon,
        tone: metrics.disputedReservations > 0 ? "danger" : "warning",
      },
    ],
    [
      metrics.disputedReservations,
      metrics.pendingPayments,
      metrics.pendingVendors,
      metrics.reservationsNeedingAttention,
    ]
  );

  const activities = useMemo<ActivityItem[]>(() => {
    const reservationActivity = reservations.slice(0, 5).map((reservation) => ({
      id: `reservation-${reservation.id}`,
      label: `Reservation #${reservation.id}`,
      detail: `${formatDate(reservation.start_date)} to ${formatDate(reservation.end_date)}`,
      amount: currency(reservation.total_price),
      date: reservation.created_at,
      tone:
        reservation.status.toUpperCase() === "DISPUTED"
          ? ("danger" as const)
          : reservation.status.toUpperCase() === "PENDING"
            ? ("warning" as const)
            : ("neutral" as const),
      status: reservation.status,
      href: "/admin/reservations",
    }));

    const paymentActivity = payments.slice(0, 5).map((payment) => ({
      id: `payment-${payment.id}`,
      label: `Payment #${payment.id}`,
      detail: `Reservations #${payment.reservation_ids.join(", #") || payment.id}`,
      amount: currency(payment.amount),
      date: payment.created_at,
      tone:
        payment.status.toUpperCase() === "APPROVED"
          ? ("success" as const)
          : payment.status.toUpperCase() === "PENDING"
            ? ("warning" as const)
            : ("danger" as const),
      status: payment.status,
      href: "/admin/payments",
    }));

    return [...reservationActivity, ...paymentActivity]
      .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())
      .slice(0, 8);
  }, [payments, reservations]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 rounded-[var(--radius-xl)]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Skeleton className="h-80 rounded-[var(--radius-xl)]" />
          <Skeleton className="h-80 rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        eyebrow="Priority queues"
        title="What needs review now"
        description="Focus first on the queues that can block vendor onboarding, payment confirmation, or reservation progress."
        actions={
          <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
            {openQueueCount} open item{openQueueCount === 1 ? "" : "s"}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {queueItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                      {item.value}
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <AdminStatusBadge
                    label={item.value > 0 ? "Needs review" : "Clear"}
                    tone={item.tone}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                <Link
                  href={item.href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
                >
                  {item.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </AdminSectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <AdminSectionCard
          eyebrow="Recent activity"
          title="Latest records"
          description="Recent reservations and payments, ordered by the newest activity first."
        >
          {activities.length === 0 ? (
            <AdminEmptyState
              title="No recent activity."
              description="Reservations and payments will appear here once the platform has more operational movement."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Record</th>
                    <th className="pb-3 font-medium">Detail</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="py-3 font-semibold text-foreground">{activity.label}</td>
                      <td className="py-3 text-muted-foreground">{activity.detail}</td>
                      <td className="py-3 text-foreground">{activity.amount || "--"}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(activity.date)}</td>
                      <td className="py-3">
                        <AdminStatusBadge label={activity.status} tone={activity.tone} />
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={activity.href}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSectionCard>

        <AdminSectionCard eyebrow="Snapshot" title="Platform at a glance" dense>
          <div className="space-y-3">
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Approved revenue
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {currency(metrics.totalRevenue)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Revenue from approved payments currently visible to the platform.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-3">
                <span className="text-muted-foreground">Approved reservations</span>
                <span className="font-semibold text-foreground">{metrics.approvedReservations}</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-3">
                <span className="text-muted-foreground">Reviewed payments</span>
                <span className="font-semibold text-foreground">{reviewedPayments}</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-3">
                <span className="text-muted-foreground">Registered users</span>
                <span className="font-semibold text-foreground">{users.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-3">
                <span className="text-muted-foreground">Disputed reservations</span>
                <span className="font-semibold text-foreground">{metrics.disputedReservations}</span>
              </div>
            </div>
          </div>
        </AdminSectionCard>
      </div>
    </div>
  );
}
