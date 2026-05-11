"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getVendorProfile, type VendorProfile } from "@/lib/vendor";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StackIcon,
  ArchiveIcon,
  CalendarIcon,
  CardStackIcon,
  ExitIcon,
  HamburgerMenuIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from "@radix-ui/react-icons";

const NAV = [
  { href: "/vendor", label: "Overview", icon: StackIcon },
  { href: "/vendor/inventory", label: "Inventory", icon: ArchiveIcon },
  { href: "/vendor/reservations", label: "Reservations", icon: CalendarIcon },
  { href: "/vendor/earnings", label: "Earnings", icon: CardStackIcon },
  { href: "/vendor/subscription", label: "Subscription", icon: StarIcon },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login?next=/vendor");
      return;
    }

    async function fetchData() {
      try {
        const resData = await getVendorProfile(token!) as any;
        if (resData && (resData.profile || (resData.status && resData.status !== "NONE"))) {
          const profileData = resData.profile || {};
          setProfile({
            ...profileData,
            store_name: profileData.business_name || profileData.store_name || "My Store",
            store_description: profileData.bio || profileData.store_description || "",
            status: resData.status || "PENDING",
          } as VendorProfile);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    // Only show full-screen loader on initial mount if we don't have profile data yet
    if (!profile && loading === false) {
      // we won't set loading to true here to avoid flashes, just refetch
    }

    fetchData();
  }, [token, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Skeleton className="h-8 w-8 rounded-sm" />
      </div>
    );
  }

  // ── not a vendor yet ───────────────────────────────────────────────────────
  if (!profile) {
    if (pathname === "/vendor/apply" || pathname === "/vendor/subscription") {
      return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 bg-background min-h-screen">
        <div className="mx-auto max-w-2xl flex flex-col gap-16">
          <div className="space-y-6 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Vendor Programme
            </p>
            <h1 className="font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
              Rent out your<br />costumes.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-lg">
              Join our curated marketplace of high-end theatrical wear and start earning from your collection.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-border pt-12 animate-fade-up-delay-1">
            {[
              { step: "01", label: "Apply", desc: "Submit your store details for review." },
              { step: "02", label: "Get approved", desc: "We'll review and notify you within 24h." },
              { step: "03", label: "List & earn", desc: "Add costumes and start accepting reservations." },
            ].map(({ step, label, desc }) => (
              <div key={step} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{step}</p>
                <p className="font-playfair text-xl font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="animate-fade-up-delay-2">
            <Link
              href="/vendor/apply"
              className="inline-flex h-12 items-center rounded-sm bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
            >
              Apply now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── pending / non-approved ─────────────────────────────────────────────────
  if (profile.status !== "APPROVED") {
    if (pathname === "/vendor/subscription") {
      return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 bg-background min-h-screen">
        <div className="mx-auto max-w-2xl flex flex-col gap-12 animate-fade-up">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-sm border border-amber-400/40 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <ExclamationTriangleIcon className="size-3" />
              {profile.status === "PENDING" ? "Under review" : profile.status}
            </span>
            <h1 className="font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Application received.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-lg">
              {profile.status === "PENDING"
                ? "Your vendor application is currently under review. We'll notify you by email once a decision is made — usually within 24 hours."
                : `Your application status is currently: ${profile.status}. Please contact support for assistance.`}
            </p>
          </div>

          <div className="border border-border rounded-sm p-8 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Submitted store details
            </p>
            <p className="font-playfair text-2xl font-semibold text-foreground">
              {profile.store_name}
            </p>
            {profile.store_description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {profile.store_description}
              </p>
            )}
          </div>

          <Link
            href="/"
            className="inline-flex h-12 w-fit items-center rounded-sm border border-border px-8 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
          >
            Return to browse
          </Link>
        </div>
      </div>
    );
  }

  // ── approved vendor layout ─────────────────────────────────────────────────
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  const Sidebar = () => (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex size-7 items-center justify-center rounded-sm bg-foreground">
          <ArchiveIcon className="size-3 text-background" />
        </div>
        <div>
          <p className="font-playfair text-sm font-semibold text-foreground leading-none">
            Snap<em>Cos</em>
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Vendor Portal
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1" aria-label="Vendor navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/vendor"
            ? pathname === "/vendor"
            : pathname.startsWith(href);
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

      <div className="border-t border-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-bold uppercase text-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground leading-none">{profile.store_name}</p>
            <p className="truncate text-[10px] text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          >
            ← Store
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-destructive/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
          >
            <ExitIcon className="size-3" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
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

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden shrink-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-sm border border-border text-foreground"
          >
            <HamburgerMenuIcon className="size-4" />
          </button>
          <p className="font-playfair text-sm font-semibold text-foreground">
            {profile.store_name}
          </p>
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
