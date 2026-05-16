"use client";

import { type ComponentType, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArchiveIcon,
  CalendarIcon,
  CardStackIcon,
  ExitIcon,
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-10 w-10 rounded-sm" />
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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
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
            <p className="truncate font-playfair text-2xl font-semibold text-foreground">{storeName}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <span
          className={cn(
            "inline-flex rounded-sm border px-2 py-1 text-[9px] font-semibold uppercase tracking-widest",
            statusMeta(vendorStatus)
          )}
        >
          {vendorStatus}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4" aria-label="Vendor navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/vendor" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                isActive
                  ? "bg-foreground text-background"
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
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-bold uppercase text-foreground">
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
            className="flex h-9 items-center justify-center rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
          >
            Storefront
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-destructive/30 px-3 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background">
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
                  "inline-flex rounded-sm border px-2 py-1 text-[9px] font-semibold uppercase tracking-widest",
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
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
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
            className="flex size-9 items-center justify-center rounded-sm border border-border text-foreground"
          >
            <HamburgerMenuIcon className="size-4" />
          </button>
          <div className="text-center">
            <p className="font-playfair text-sm font-semibold text-foreground">{storeName}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              {vendorStatus}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
