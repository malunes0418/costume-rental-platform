"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  StackIcon,
  CardStackIcon,
  CalendarIcon,
  ArchiveIcon,
  PersonIcon,
  ExitIcon,
  HamburgerMenuIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";

const NAV = [
  { href: "/admin", label: "Overview", icon: StackIcon },
  { href: "/admin/vendors", label: "Vendors", icon: CardStackIcon },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarIcon },
  { href: "/admin/payments", label: "Payments", icon: ArchiveIcon },
  { href: "/admin/users", label: "Users", icon: PersonIcon },
];

type AdminSidebarProps = {
  email?: string;
  initials: string;
  name?: string;
  onLogout: () => void;
  onNavigate: () => void;
  pathname: string;
};

function AdminSidebar({ email, initials, name, onLogout, onNavigate, pathname }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-20 items-center justify-between gap-3 border-b border-border px-6">
        <div className="space-y-2">
          <BrandLogo size="md" />
          <p className="pl-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Admin Console
          </p>
        </div>
        <div className="flex size-8 items-center justify-center rounded-[1rem] border border-border bg-muted text-foreground">
          <LockClosedIcon className="size-3.5" />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
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
          <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-bold uppercase text-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-none text-foreground">{name || "Admin"}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{email}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-destructive/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
          >
            <ExitIcon className="size-3" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const initials = user.name
    ? user.name.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <AdminSidebar
          email={user.email}
          initials={initials}
          name={user.name}
          onLogout={() => void handleLogout()}
          onNavigate={() => setSidebarOpen(false)}
          pathname={pathname}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex h-full">
            <AdminSidebar
              email={user.email}
              initials={initials}
              name={user.name}
              onLogout={() => void handleLogout()}
              onNavigate={() => setSidebarOpen(false)}
              pathname={pathname}
            />
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
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" variant="mark" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Admin
            </p>
          </div>
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
