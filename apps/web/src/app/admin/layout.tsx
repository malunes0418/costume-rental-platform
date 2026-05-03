"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  StackIcon,
  CardStackIcon,
  CalendarIcon,
  ArchiveIcon,
  PersonIcon,
  ExitIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  LockClosedIcon,
} from "@radix-ui/react-icons";

const NAV = [
  { href: "/admin",              label: "Overview",     icon: StackIcon },
  { href: "/admin/vendors",      label: "Vendors",      icon: CardStackIcon },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarIcon },
  { href: "/admin/payments",     label: "Payments",     icon: ArchiveIcon },
  { href: "/admin/users",        label: "Users",        icon: PersonIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuth();
  const router  = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── access guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { router.push("/login?next=/admin"); return; }
    if (user && user.role !== "ADMIN") { router.push("/"); }
  }, [token, user, router]);

  if (!token || !user || user.role !== "ADMIN") return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  const Sidebar = () => (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">

      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex size-7 items-center justify-center rounded-sm bg-foreground">
          <LockClosedIcon className="size-3 text-background" />
        </div>
        <div>
          <p className="font-playfair text-sm font-semibold text-foreground leading-none">
            Snap<em>Cos</em>
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin"
            ? pathname === "/admin"
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

      {/* User + actions */}
      <div className="border-t border-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-bold uppercase text-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground leading-none">{user.name || "Admin"}</p>
            <p className="truncate text-[10px] text-muted-foreground mt-0.5">{user.email}</p>
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

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
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

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile topbar */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-sm border border-border text-foreground"
          >
            <HamburgerMenuIcon className="size-4" />
          </button>
          <p className="font-playfair text-sm font-semibold text-foreground">
            Snap<em>Cos</em> Admin
          </p>
          <ThemeToggle />
        </div>

        {/* Page content scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
