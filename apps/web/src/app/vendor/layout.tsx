"use client";

import { type ComponentType, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArchiveIcon,
  CalendarIcon,
  CardStackIcon,
  ExitIcon,
  GearIcon,
  HamburgerMenuIcon,
  StackIcon,
  StarIcon,
} from "@radix-ui/react-icons";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getVendorProfile, type VendorProfile } from "@/lib/vendor";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const BASE_NAV: NavItem[] = [
  { href: "/vendor", label: "Overview", icon: StackIcon },
  { href: "/vendor/inventory", label: "Inventory", icon: ArchiveIcon },
  { href: "/vendor/settings", label: "Settings", icon: GearIcon },
  { href: "/vendor/subscription", label: "Subscription", icon: StarIcon },
];

const OPERATIONAL_NAV: NavItem[] = [
  { href: "/vendor/reservations", label: "Reservations", icon: CalendarIcon },
  { href: "/vendor/earnings", label: "Earnings", icon: CardStackIcon },
];

function statusMeta(status: VendorProfile["vendorStatus"]) {
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

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex h-screen overflow-hidden page-bg">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="flex h-20 items-center border-b border-border px-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-2.5 w-20 rounded-full" />
            </div>
          </div>
          <div className="space-y-3 border-b border-border bg-muted/30 px-6 py-5">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="h-3 w-44 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-2 px-3 py-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-3 border-t border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-2.5 w-32 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
            <Skeleton className="size-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="mx-auto h-3 w-24 rounded-full" />
              <Skeleton className="mx-auto h-2 w-14 rounded-full" />
            </div>
            <Skeleton className="size-9 rounded-xl" />
          </div>

          <main className="flex-1 overflow-y-auto bg-muted/40">
            <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
              <div className="overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl space-y-4">
                    <Skeleton className="h-3 w-44 rounded-full" />
                    <Skeleton className="h-12 w-full max-w-md rounded-xl md:h-16" />
                    <Skeleton className="h-4 w-full max-w-sm rounded-full" />
                    <Skeleton className="h-4 w-3/4 max-w-xs rounded-full" />
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Skeleton className="h-11 w-40 rounded-md" />
                      <Skeleton className="h-11 w-44 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-[4.5rem] min-w-[7rem] rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <div className="space-y-3 p-4 sm:p-5">
                      <Skeleton className="h-6 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                      <div className="flex items-end justify-between pt-2">
                        <Skeleton className="h-7 w-20 rounded-lg" />
                        <Skeleton className="h-6 w-10 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const vendorStatus = profile?.vendorStatus ?? "NONE";
  const storeName = profile?.profile?.business_name || user.name || "Your atelier";
  const isApprovedVendor = vendorStatus === "APPROVED";
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

  const Sidebar = () => (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-20 items-center border-b border-border px-6">
        <div className="space-y-2">
          <BrandLogo size="md" />
          <p className="pl-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Vendor House
          </p>
        </div>
      </div>

      <div className="space-y-4 border-b border-border bg-muted/30 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-foreground">{storeName}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest",
            statusMeta(vendorStatus)
          )}
        >
          {vendorStatus}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Vendor navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/vendor" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold uppercase text-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-none text-foreground">{storeName}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="flex h-9 items-center justify-center rounded-xl border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
          >
            Storefront
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 px-3 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
          >
            <ExitIcon className="size-3" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );

  if (!isApprovedVendor) {
    return (
      <div className="min-h-screen page-bg">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
            <div>
              <Link href="/" aria-label="SnapCos home">
                <BrandLogo size="md" />
              </Link>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Vendor House
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest",
                  statusMeta(vendorStatus)
                )}
              >
                {vendorStatus}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden page-bg">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-brand-ink/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex h-full">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl border border-border text-foreground"
          >
            <HamburgerMenuIcon className="size-4" />
          </button>
          <div className="text-center">
            <p className="font-display text-sm font-semibold text-foreground">{storeName}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              {vendorStatus}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto bg-muted/40">{children}</main>
      </div>
    </div>
  );
}
