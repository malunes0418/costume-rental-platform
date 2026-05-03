"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Heart, CalendarDays, Bell, ChevronDown, LogOut, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/",             label: "Browse" },
  { href: "/wishlist",     label: "Wishlist",       icon: Heart },
  { href: "/trips",        label: "Reservations",   icon: CalendarDays },
  { href: "/notifications",label: "Notifications",  icon: Bell },
];

export function Navbar() {
  const { user, token, logout } = useAuth();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)]"
          : "bg-[var(--bg)] border-b border-[var(--border)]"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-5 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-decoration-none shrink-0">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          >
            S
          </span>
          <span
            className="text-[1.05rem] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-body)", color: "var(--text)" }}
          >
            Snap<span style={{ color: "var(--accent)" }}>Cos</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" role="navigation" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3.5 py-1.5 text-[0.85rem] font-medium rounded-md transition-colors duration-150"
              style={{ color: "var(--text-2)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {label}
            </Link>
          ))}

          <span className="mx-3 h-4 w-px" style={{ background: "var(--border-2)" }} />

          {!token ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-md text-[0.85rem] font-medium"
                style={{ color: "var(--text-2)" }}
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-md text-[0.85rem] font-medium"
                style={{ background: "var(--text)", color: "var(--bg)", border: "none" }}
              >
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 rounded-md px-2 hover:bg-[var(--bg-subtle)]"
                >
                  <Avatar className="size-6">
                    <AvatarFallback
                      className="text-[0.6rem] font-semibold"
                      style={{ background: "var(--surface-3)", color: "var(--text)" }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[0.85rem] font-medium" style={{ color: "var(--text)" }}>
                    {user?.name?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown className="size-3 opacity-40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 rounded-lg border p-1 shadow-sm"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <DropdownMenuLabel className="text-[0.72rem] font-normal" style={{ color: "var(--text-3)" }}>
                  {user?.email || "My Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                <DropdownMenuItem asChild>
                  <Link href="/trips" className="cursor-pointer flex items-center gap-2 text-[0.875rem]" style={{ color: "var(--text)" }}>
                    <CalendarDays className="size-4 opacity-50" /> Reservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="cursor-pointer flex items-center gap-2 text-[0.875rem]" style={{ color: "var(--text)" }}>
                    <Heart className="size-4 opacity-50" /> Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="cursor-pointer flex items-center gap-2 text-[0.875rem]" style={{ color: "var(--text)" }}>
                    <Bell className="size-4 opacity-50" /> Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vendor" className="cursor-pointer flex items-center gap-2 text-[0.875rem]" style={{ color: "var(--text)" }}>
                    <Store className="size-4 opacity-50" /> Vendor Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer flex items-center gap-2 text-[0.875rem] text-red-500 focus:text-red-500 focus:bg-red-50"
                >
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          className="flex md:hidden size-8 items-center justify-center rounded-md transition-colors duration-150"
          style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="flex flex-col border-t px-4 py-3 gap-0.5 md:hidden animate-fade-in"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.875rem] font-medium transition-colors duration-150"
              style={{ color: "var(--text-2)" }}
            >
              {Icon && <Icon className="size-4 opacity-50" />}
              {label}
            </Link>
          ))}
          <hr style={{ margin: "6px 0", borderColor: "var(--border)" }} />
          {!token ? (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center rounded-md border px-4 py-2 text-[0.875rem] font-medium"
                style={{ borderColor: "var(--border-2)", color: "var(--text)" }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center rounded-md px-4 py-2 text-[0.875rem] font-medium"
                style={{ background: "var(--text)", color: "var(--bg)" }}
              >
                Sign up
              </Link>
            </div>
          ) : (
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.875rem] font-medium text-red-500"
            >
              <LogOut className="size-4" /> Log out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
