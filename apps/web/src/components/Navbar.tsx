"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HamburgerMenuIcon as Menu,
  Cross1Icon as X,
  HeartIcon as Heart,
  CalendarIcon as CalendarDays,
  ExitIcon as LogOut,
  DashboardIcon as Store,
  ChevronDownIcon as ChevronDown,
  LockClosedIcon as Shield,
  MagnifyingGlassIcon as Search,
} from "@radix-ui/react-icons";
import { CreditCard, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./NotificationBell";
import { useCart } from "../lib/CartContext";
import { CartDrawer } from "./CartDrawer";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryFilters } from "@/components/marketplace/constants";

function NavbarSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="hidden flex-1 md:flex md:max-w-xl lg:max-w-2xl">
      <div className="flex w-full items-center gap-2 rounded-full border border-border bg-muted/50 pl-4 pr-1.5 transition-colors focus-within:border-primary/40 focus-within:bg-card">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search costumes…"
          aria-label="Search costumes"
          className="h-10 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="sm" className="h-8 rounded-full px-4 text-xs font-semibold">
          Search
        </Button>
      </div>
    </form>
  );
}

function CategoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/" ? searchParams.get("category") || "" : "";

  if (pathname !== "/") return null;

  return (
    <nav
      className="hidden overflow-x-auto border-t border-border md:block"
      aria-label="Browse categories"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-4 md:px-6">
        {categoryFilters.map(({ value, label }) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value) {
            params.set("category", value);
          } else {
            params.delete("category");
          }
          params.delete("page");
          const href = params.toString() ? `/?${params.toString()}` : "/";
          const isActive = activeCategory === value;

          return (
            <Link
              key={value || "all"}
              href={href}
              className={cn(
                "shrink-0 px-3 py-3 text-xs font-semibold uppercase tracking-widest transition-colors",
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-primary"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavbarInner() {
  const { user, logout } = useAuth();
  const { openCart } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleLogout = useCallback(async () => {
    await logout();
    setMenuOpen(false);
    router.replace("/login");
  }, [logout, router]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled ? "border-border bg-background/95 backdrop-blur-md" : "border-border bg-background"
        )}
      >
        {/* Row 1: logo + search + utilities */}
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 md:h-16 md:gap-6 md:px-6">
          <Link
            href="/"
            aria-label="SnapCos home"
            className="shrink-0 transition-transform duration-300 hover:scale-[0.99]"
          >
            <BrandLogo priority size="md" />
          </Link>

          <Suspense fallback={<div className="hidden flex-1 md:block" />}>
            <NavbarSearch />
          </Suspense>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {user && <NotificationBell />}
            {user && user.role !== "ADMIN" && (
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ShoppingBag className="size-4" />
              </button>
            )}
            <ThemeToggle />

            {!user ? (
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/login"
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group hidden items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-muted focus:outline-none sm:flex"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {initials}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                      {user?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 rounded-xl border border-border bg-card p-0"
                >
                  <div className="border-b border-border px-5 py-4">
                    <p className="font-display text-base font-semibold leading-tight text-foreground">
                      {user?.name || "Account"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>

                  {user?.role !== "ADMIN" && (
                    <>
                      <div className="py-1.5">
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-widest">
                          <Link href="/reservations">
                            <CalendarDays className="size-3.5 shrink-0" />
                            Reservations
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-widest">
                          <Link href="/wishlist">
                            <Heart className="size-3.5 shrink-0" />
                            Wishlist
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {user?.role === "ADMIN" && (
                    <>
                      <div className="py-1.5">
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-widest">
                          <Link href="/admin">
                            <Shield className="size-3.5 shrink-0" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {user?.role !== "ADMIN" && (
                    <>
                      <div className="py-1.5">
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-widest">
                          <Link href="/vendor">
                            <Store className="size-3.5 shrink-0" />
                            Vendor Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-widest">
                          <Link href="/vendor/subscription">
                            <CreditCard className="size-3.5 shrink-0" />
                            Subscription
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <div className="py-1.5">
                    <DropdownMenuItem
                      onClick={() => void handleLogout()}
                      className="cursor-pointer gap-3 rounded-lg px-5 py-3 text-xs font-semibold uppercase tracking-widest text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-3.5 shrink-0" />
                      Log out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted md:hidden"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: category nav */}
        <Suspense fallback={null}>
          <CategoryNav />
        </Suspense>
      </header>

      {menuOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 top-14 z-50 bg-background md:hidden">
            <div className="flex h-full flex-col overflow-y-auto px-6 pb-12 pt-6">
              <Suspense fallback={null}>
                <NavbarSearchMobile onNavigate={() => setMenuOpen(false)} />
              </Suspense>

              {user && (
                <div className="mb-6 mt-6 border-b border-border pb-6">
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {user.name || "Account"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                </div>
              )}

              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {[
                  { href: "/", label: "Browse" },
                  ...(user
                    ? [
                        ...(user?.role !== "ADMIN"
                          ? [
                              { href: "/reservations", label: "Reservations" },
                              { href: "/wishlist", label: "Wishlist" },
                            ]
                          : []),
                        ...(user?.role === "ADMIN"
                          ? [{ href: "/admin", label: "Admin Dashboard" }]
                          : [
                              { href: "/vendor", label: "Vendor Dashboard" },
                              { href: "/vendor/subscription", label: "Subscription" },
                            ]),
                      ]
                    : []),
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center border-b border-border/50 py-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground transition-colors last:border-0 hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Theme
                  </span>
                  <ThemeToggle />
                </div>

                {!user ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-xs font-semibold uppercase tracking-widest"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold uppercase tracking-widest text-primary-foreground"
                    >
                      Sign up
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-xs font-semibold uppercase tracking-widest text-destructive"
                  >
                    <LogOut className="mr-2.5 size-3.5" />
                    Log out
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      <CartDrawer />
    </>
  );
}

function NavbarSearchMobile({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    router.push(`/?${params.toString()}`);
    onNavigate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-muted/50 pl-3 pr-1">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search costumes…"
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" size="sm" className="h-10 rounded-full px-4">
        Go
      </Button>
    </form>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  );
}
