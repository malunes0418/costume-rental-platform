"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
} from "@radix-ui/react-icons";
import { CreditCard, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./NotificationBell";
import { useCart } from "../lib/CartContext";
import { CartDrawer } from "./CartDrawer";

export function Navbar() {
  const { user, logout } = useAuth();
  const { openCart } = useCart();
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
      window.scrollTo({ top: 0 });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-border"
          : "bg-background border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 md:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="shrink-0 group flex items-center gap-2">
          {/* Minimal wordmark */}
          <span className="font-playfair text-xl font-semibold tracking-tight text-foreground group-hover:opacity-70 transition-opacity">
            Snap<em>Cos</em>
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden items-center gap-8 md:flex" role="navigation" aria-label="Main navigation">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse
          </Link>

          {user && user.role !== "ADMIN" && (
            <>
              <Link
                href="/reservations"
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                Reservations
              </Link>
              <Link
                href="/wishlist"
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                Wishlist
              </Link>
            </>
          )}
        </nav>

        {/* ── Desktop Actions ── */}
        <div className="hidden items-center gap-4 md:flex">
          {user && <NotificationBell />}
          {user && user.role !== "ADMIN" && (
              <button
                onClick={openCart}
                className="flex size-9 items-center justify-center rounded-sm border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <ShoppingBag className="size-4" />
              </button>
          )}
          <ThemeToggle />

          {!user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-md border border-foreground bg-foreground px-5 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-2.5 rounded-sm px-3 py-1.5 transition-colors hover:bg-muted focus:outline-none"
                >
                  {/* Avatar monogram */}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-bold uppercase tracking-wider text-foreground group-hover:border-foreground/30 transition-colors">
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
                className="w-64 rounded-md border border-border bg-background p-0 shadow-none"
              >
                {/* User identity block */}
                <div className="border-b border-border px-5 py-4">
                  <p className="font-playfair text-base font-semibold text-foreground leading-tight">
                    {user?.name || "Account"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Navigation group */}
                {user?.role !== "ADMIN" && (
                  <>
                    <div className="py-1.5">
                      <DropdownMenuItem asChild className="rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground focus:text-foreground focus:bg-muted cursor-pointer gap-3">
                        <Link href="/reservations">
                          <CalendarDays className="size-3.5 shrink-0" />
                          Reservations
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground focus:text-foreground focus:bg-muted cursor-pointer gap-3">
                        <Link href="/wishlist">
                          <Heart className="size-3.5 shrink-0" />
                          Wishlist
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-0 bg-border" />
                  </>
                )}

                {/* Admin group — only for ADMIN role */}
                {user?.role === "ADMIN" && (
                  <>
                    <div className="py-1.5">
                      <DropdownMenuItem asChild className="rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground focus:text-foreground focus:bg-muted cursor-pointer gap-3">
                        <Link href="/admin">
                          <Shield className="size-3.5 shrink-0" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="my-0 bg-border" />
                  </>
                )}

                {/* Vendor group — hidden for admins */}
                {user?.role !== "ADMIN" && (
                  <>
                    <div className="py-1.5">
                      <DropdownMenuItem asChild className="rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground focus:text-foreground focus:bg-muted cursor-pointer gap-3">
                        <Link href="/vendor">
                          <Store className="size-3.5 shrink-0" />
                          Vendor Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground focus:text-foreground focus:bg-muted cursor-pointer gap-3">
                        <Link href="/vendor/subscription">
                          <CreditCard className="size-3.5 shrink-0" />
                          Subscription
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="my-0 bg-border" />
                  </>
                )}

                {/* Sign out */}
                <div className="py-1.5">
                  <DropdownMenuItem
                    onClick={logout}
                    className="rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-widest text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-3"
                  >
                    <LogOut className="size-3.5 shrink-0" />
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* ── Mobile Trigger ── */}
        <div className="flex items-center gap-3 md:hidden">
          {user && <NotificationBell />}
          {user && user.role !== "ADMIN" && (
            <button
              onClick={openCart}
              className="flex size-9 items-center justify-center rounded-sm border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <ShoppingBag className="size-4" />
            </button>
          )}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            className="flex size-9 items-center justify-center rounded-sm border border-border text-foreground transition-colors hover:bg-muted"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
    </header>

      {/* ── Mobile Drawer (portaled to body) ── */}
      {menuOpen && mounted && createPortal(
        <div className="fixed inset-0 top-16 z-50 bg-background md:hidden">
          <div className="flex h-full flex-col overflow-y-auto px-6 pb-12 pt-8">

            {/* User identity (if logged in) */}
            {user && (
              <div className="mb-8 border-b border-border pb-6">
                <p className="font-playfair text-2xl font-semibold text-foreground">
                  {user.name || "Account"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {[
                { href: "/", label: "Browse" },
                ...(user ? [
                  ...(user?.role !== "ADMIN" ? [
                    { href: "/reservations", label: "Reservations" },
                    { href: "/wishlist", label: "Wishlist" },
                  ] : []),
                  ...(user?.role === "ADMIN"
                    ? [{ href: "/admin", label: "Admin Dashboard" }]
                    : [
                        { href: "/vendor", label: "Vendor Dashboard" },
                        { href: "/vendor/subscription", label: "Subscription" },
                      ]
                  ),
                ] : []),
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center py-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground border-b border-border/50 last:border-0"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth actions */}
            <div className="mt-auto pt-8 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>

              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex h-12 w-full items-center justify-center rounded-md border border-border text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex h-12 w-full items-center justify-center rounded-md border border-border text-xs font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
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
      {/* ── Cart Drawer ── */}
      <CartDrawer />
    </>
  );
}
