"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon as CalendarDays,
  ChevronDownIcon,
  Cross1Icon,
  DashboardIcon as Store,
  ExitIcon as LogOut,
  HamburgerMenuIcon,
  HeartIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { CreditCard, ShoppingBag } from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/auth";
import { CartDrawer } from "./CartDrawer";

const utilityButtonClass =
  "inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[0_1px_0_color-mix(in_oklab,white_35%,transparent)] transition-[border-color,background-color,color] duration-[var(--dur-fast)] hover:border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] hover:bg-accent hover:text-foreground dark:shadow-[0_1px_0_color-mix(in_oklab,white_7%,transparent)]";

const mobileLinkClass =
  "flex items-center justify-between rounded-[var(--radius-md)] border border-transparent px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-border hover:bg-accent";

export function Navbar() {
  const { user, logout } = useAuth();
  const { openCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navItems = useMemo(() => {
    const items = [{ href: "/", label: "Browse" }];

    if (user && user.role !== "ADMIN") {
      items.push(
        { href: "/reservations", label: "Reservations" },
        { href: "/wishlist", label: "Wishlist" }
      );
    }

    return items;
  }, [user]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((namePart) => namePart[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    router.replace("/login");
  }

  function isActiveHref(href: string) {
    return href === "/" ? pathname === href : pathname?.startsWith(href);
  }

  function navLinkClass(href: string) {
    const isActive = isActiveHref(href);

    return cn(
      "rounded-full px-3 py-2 text-sm font-semibold transition-[background-color,color,border-color] duration-[var(--dur-fast)]",
      isActive
        ? "bg-[color:color-mix(in_oklab,var(--color-brand)_8%,var(--color-card))] text-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );
  }

  return (
    <>
      <div className="sticky top-0 z-50 px-3 pt-3 md:px-4">
        <header
          className={cn(
            "surface-shell mx-auto max-w-[1360px] rounded-[var(--radius-xl)] px-4 py-3 transition-[padding,box-shadow,background-color] duration-[var(--dur-fast)] md:px-5",
            scrolled && "bg-[color:color-mix(in_oklab,var(--color-background)_82%,var(--color-card))] backdrop-blur"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label="SnapCos home" className="min-w-0 shrink-0">
              <BrandLogo priority size="sm" />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {navItems.map(({ href, label }) => (
                <Link key={href} href={href} className={navLinkClass(href)}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              {user ? <NotificationBell /> : null}
              {user && user.role !== "ADMIN" ? (
                <button type="button" onClick={openCart} className={utilityButtonClass} aria-label="Open cart">
                  <ShoppingBag className="size-4" />
                </button>
              ) : null}
              <ThemeToggle />

              {!user ? (
                <>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonVariants({ variant: "brand", size: "sm" }), "rounded-full")}
                  >
                    Create account
                  </Link>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-2.5 py-1.5 text-left shadow-[0_1px_0_color-mix(in_oklab,white_35%,transparent)] transition-[border-color,background-color,color] duration-[var(--dur-fast)] hover:border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] hover:bg-accent dark:shadow-[0_1px_0_color-mix(in_oklab,white_7%,transparent)]"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full border border-border bg-[color:color-mix(in_oklab,var(--color-background)_50%,var(--color-card))] text-xs font-bold uppercase text-foreground">
                        {initials}
                      </span>
                      <span className="hidden min-w-0 md:block">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {user.name?.split(" ")[0] || "Account"}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {user.role === "ADMIN" ? "Admin account" : "Marketplace account"}
                        </span>
                      </span>
                      <ChevronDownIcon className="size-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" sideOffset={10} className="w-72">
                    <DropdownMenuLabel className="normal-case tracking-normal">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{user.name || "Account"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {user.role !== "ADMIN" ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/reservations">
                            <CalendarDays className="size-4" />
                            Reservations
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/wishlist">
                            <HeartIcon className="size-4" />
                            Wishlist
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor">
                            <Store className="size-4" />
                            Vendor workspace
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/subscription">
                            <CreditCard className="size-4" />
                            Subscription
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <LockClosedIcon className="size-4" />
                          Admin console
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                      <LogOut className="size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {user ? <NotificationBell /> : null}
              {user && user.role !== "ADMIN" ? (
                <button type="button" onClick={openCart} className={utilityButtonClass} aria-label="Open cart">
                  <ShoppingBag className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={utilityButtonClass}
              >
                {menuOpen ? <Cross1Icon className="size-4" /> : <HamburgerMenuIcon className="size-4" />}
              </button>
            </div>
          </div>
        </header>
      </div>

      {menuOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-50 px-3 pb-3 pt-[5.5rem] md:hidden">
              <button
                type="button"
                aria-label="Close mobile menu"
                className="absolute inset-0 bg-[color:color-mix(in_oklab,var(--color-foreground)_16%,transparent)] backdrop-blur-[3px]"
                onClick={() => setMenuOpen(false)}
              />
              <div className="surface-elevated relative mx-auto flex h-full max-w-[28rem] flex-col overflow-hidden rounded-[var(--radius-xl)]">
                <div className="border-b border-border px-5 py-4">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-xs font-bold uppercase text-foreground">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{user.name || "Account"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">SnapCos</p>
                      <p className="text-xs text-muted-foreground">
                        Browse, reserve, and manage your costume rentals from one product surface.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <nav className="space-y-2" aria-label="Mobile navigation">
                    {navItems.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          mobileLinkClass,
                          isActiveHref(href)
                            ? "border-[color:color-mix(in_oklab,var(--color-brand)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_7%,var(--color-card))]"
                            : ""
                        )}
                      >
                        <span>{label}</span>
                      </Link>
                    ))}

                    {user?.role === "ADMIN" ? (
                      <Link href="/admin" onClick={() => setMenuOpen(false)} className={mobileLinkClass}>
                        <span>Admin console</span>
                      </Link>
                    ) : null}

                    {user && user.role !== "ADMIN" ? (
                      <>
                        <Link href="/vendor" onClick={() => setMenuOpen(false)} className={mobileLinkClass}>
                          <span>Vendor workspace</span>
                        </Link>
                        <Link
                          href="/vendor/subscription"
                          onClick={() => setMenuOpen(false)}
                          className={mobileLinkClass}
                        >
                          <span>Subscription</span>
                        </Link>
                      </>
                    ) : null}
                  </nav>
                </div>

                <div className="border-t border-border px-4 py-4">
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-card px-3 py-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Appearance
                      </p>
                      <p className="text-sm text-foreground">Light or dark</p>
                    </div>
                    <ThemeToggle />
                  </div>

                  {!user ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMenuOpen(false)}
                        className={cn(buttonVariants({ variant: "brand", size: "sm" }), "w-full justify-center")}
                      >
                        Sign up
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "mt-3 w-full justify-center")}
                    >
                      <LogOut className="size-4" />
                      Log out
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <CartDrawer />
    </>
  );
}
