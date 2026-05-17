"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArchiveIcon,
  CalendarIcon,
  CardStackIcon,
  StackIcon,
  StarIcon,
} from "@radix-ui/react-icons";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { AppShell, ShellHeader, type ShellNavItem } from "@/components/shell/AppShell";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getVendorProfile, type VendorProfile } from "@/lib/vendor";

const BASE_NAV: ShellNavItem[] = [
  {
    href: "/vendor",
    label: "Overview",
    icon: StackIcon,
    group: "core",
    meta: "Health, approvals, and next actions",
  },
  {
    href: "/vendor/inventory",
    label: "Inventory",
    icon: ArchiveIcon,
    group: "core",
    meta: "Listings, draft state, and publishing",
  },
  {
    href: "/vendor/subscription",
    label: "Subscription",
    icon: StarIcon,
    group: "core",
    meta: "Plan, renewal, and access limits",
  },
];

const OPERATIONAL_NAV: ShellNavItem[] = [
  {
    href: "/vendor/reservations",
    label: "Reservations",
    icon: CalendarIcon,
    group: "operations",
    meta: "Requests, proof review, and decisions",
  },
  {
    href: "/vendor/earnings",
    label: "Earnings",
    icon: CardStackIcon,
    group: "operations",
    meta: "Revenue, fees, and payout progress",
  },
];

const ROUTE_META = [
  {
    href: "/vendor/reservations",
    title: "Reservations",
    description: "Review incoming requests, payment evidence, and decision queues without losing context.",
  },
  {
    href: "/vendor/earnings",
    title: "Earnings",
    description: "Keep a clean view of revenue, fees, and what still needs attention before payout.",
  },
  {
    href: "/vendor/inventory",
    title: "Inventory",
    description: "Shape your collection, move strong drafts forward, and keep listing status obvious at a glance.",
  },
  {
    href: "/vendor/subscription",
    title: "Subscription",
    description: "Manage plan access, billing confidence, and the limits that affect storefront momentum.",
  },
  {
    href: "/vendor",
    title: "Overview",
    description: "Monitor collection health, approval state, and the next best operational move for your storefront.",
  },
];

function getRouteMeta(pathname: string) {
  return ROUTE_META.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? ROUTE_META[ROUTE_META.length - 1];
}

function statusClasses(status: VendorProfile["vendorStatus"]) {
  if (status === "APPROVED") {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "PENDING") {
    return "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (status === "REJECTED") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-border bg-card text-muted-foreground";
}

function StatusBadge({ status }: { status: VendorProfile["vendorStatus"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        statusClasses(status)
      )}
    >
      {status}
    </span>
  );
}

function PendingShell({
  children,
  title,
  description,
  status,
}: {
  children: ReactNode;
  title: string;
  description: string;
  status: VendorProfile["vendorStatus"];
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-3 py-3 md:px-4 md:py-4">
        <div className="surface-shell flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] px-4 py-3 md:px-5">
          <Link href="/" aria-label="SnapCos home" className="inline-flex">
            <BrandLogo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
        <ShellHeader
          density="vendor"
          eyebrow="Vendor workspace"
          title={title}
          description={description}
          badge={<StatusBadge status={status} />}
          actions={
            <>
              <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Storefront
              </Link>
            </>
          }
        />
        <main>{children}</main>
      </div>
    </div>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    async function fetchData() {
      try {
        const vendorData = await getVendorProfile();
        setProfile(vendorData);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [isAuthLoading, router, user]);

  const navItems = useMemo(() => {
    if (!profile?.canAcceptReservations) {
      return BASE_NAV;
    }

    return [...BASE_NAV, ...OPERATIONAL_NAV];
  }, [profile?.canAcceptReservations]);

  if (loading || isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="surface-shell flex w-full max-w-sm items-center gap-4 rounded-[var(--radius-xl)] p-5">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3 w-48 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const vendorStatus = profile?.vendorStatus ?? "NONE";
  const storeName = profile?.profile?.business_name || user.name || "Your atelier";
  const meta = getRouteMeta(pathname);
  const initials = (user.name || storeName)
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (vendorStatus !== "APPROVED") {
    const pendingTitle =
      vendorStatus === "PENDING"
        ? `${storeName} is under review`
        : vendorStatus === "REJECTED"
          ? "Your application needs revision"
          : "Start your vendor workspace";

    const pendingDescription =
      vendorStatus === "PENDING"
        ? "Build private drafts and keep your collection moving while the team reviews your documents."
        : vendorStatus === "REJECTED"
          ? "Review the feedback, update your details, and come back with a stronger submission."
          : "Set up your application, understand the approval gates, and prepare listings with confidence.";

    return (
      <PendingShell title={pendingTitle} description={pendingDescription} status={vendorStatus}>
        {children}
      </PendingShell>
    );
  }

  return (
    <AppShell
      density="vendor"
      brandCaption="Vendor house"
      eyebrow="Vendor workspace"
      title={meta.title}
      description={meta.description}
      badge={<StatusBadge status={vendorStatus} />}
      actions={
        <>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Storefront
          </Link>
          <ThemeToggle />
        </>
      }
      navItems={navItems}
      pathname={pathname}
      accountName={storeName}
      accountEmail={user.email}
      initials={initials}
      onLogout={() => void handleLogout()}
    >
      {children}
    </AppShell>
  );
}
