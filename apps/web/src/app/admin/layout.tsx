"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArchiveIcon,
  CalendarIcon,
  CardStackIcon,
  DashboardIcon,
  LockClosedIcon,
  PersonIcon,
  StackIcon,
} from "@radix-ui/react-icons";

import { AppShell, type ShellNavItem } from "@/components/shell/AppShell";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV: ShellNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: StackIcon,
    group: "core",
    meta: "Priority queues and platform snapshot",
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    icon: DashboardIcon,
    group: "operations",
    meta: "Listing moderation, visibility, and catalog state",
  },
  {
    href: "/admin/vendors",
    label: "Vendors",
    icon: CardStackIcon,
    group: "governance",
    meta: "Approvals, review notes, and account state",
  },
  {
    href: "/admin/reservations",
    label: "Reservations",
    icon: CalendarIcon,
    group: "operations",
    meta: "Lifecycle review and overrides",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: ArchiveIcon,
    group: "operations",
    meta: "Receipt verification and payout confidence",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: PersonIcon,
    group: "governance",
    meta: "Roles, suspension state, and access control",
  },
];

const ROUTE_META = [
  {
    href: "/admin/inventory",
    title: "Inventory",
    description: "Control listing visibility, moderation state, and catalog quality from one dense review surface.",
  },
  {
    href: "/admin/vendors",
    title: "Vendors",
    description: "Triage approvals, review notes, and vendor trust states with less noise and more signal.",
  },
  {
    href: "/admin/reservations",
    title: "Reservations",
    description: "Audit transaction flow, intervene when necessary, and keep renter-vendor decisions easy to parse.",
  },
  {
    href: "/admin/payments",
    title: "Payments",
    description: "Review proof submissions, resolve pending states quickly, and keep financial moderation explicit.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "Manage roles, suspension state, and account visibility with an operational frame.",
  },
  {
    href: "/admin",
    title: "Overview",
    description: "Review the active queues first, then scan recent platform activity and core system totals.",
  },
];

function getRouteMeta(pathname: string) {
  return ROUTE_META.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? ROUTE_META[ROUTE_META.length - 1];
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      <LockClosedIcon className="size-3" />
      Admin
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || !user || user.role !== "ADMIN") return null;

  const meta = getRouteMeta(pathname);
  const initials = user.name
    ? user.name.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <AppShell
      density="admin"
      brandCaption="Admin console"
      eyebrow="Platform administration"
      title={meta.title}
      description={meta.description}
      badge={<AdminBadge />}
      actions={
        <>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Storefront
          </Link>
          <ThemeToggle />
        </>
      }
      navItems={NAV}
      pathname={pathname}
      accountName={user.name || "Admin"}
      accountEmail={user.email}
      initials={initials}
      onLogout={() => void handleLogout()}
      homeHref="/"
      homeLabel="Storefront"
    >
      {children}
    </AppShell>
  );
}
