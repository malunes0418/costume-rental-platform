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
import {
  HamburgerMenuIcon as Menu,
  Cross1Icon as X,
  HeartIcon as Heart,
  CalendarIcon as CalendarDays,
  BellIcon as Bell,
  ChevronDownIcon as ChevronDown,
  ExitIcon as LogOut,
  DashboardIcon as Store,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./NotificationBell";

const mobileLinks = [
  { href: "/wishlist",     label: "Wishlist",       icon: Heart },
  { href: "/trips",        label: "Reservations",   icon: CalendarDays },
  { href: "/vendor",       label: "Vendor Dashboard", icon: Store },
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
        "sticky top-0 z-50 transition-all duration-200 border-b",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-border shadow-sm"
          : "bg-background border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-sm transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            S
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Snap<span className="text-primary">Cos</span>
          </span>
        </Link>

        {/* Global Search (Desktop) */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <Button 
            variant="outline" 
            className="relative w-full max-w-sm justify-start text-muted-foreground bg-muted/20 hover:bg-muted/50 border-border/50 h-9 px-3 font-normal shadow-none"
          >
            <MagnifyingGlassIcon className="mr-2 size-4" />
            <span className="text-sm">Search costumes...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex" role="navigation" aria-label="Main navigation">
          
          {token && (
            <NotificationBell />
          )}

          <ThemeToggle />

          {!token ? (
            <div className="flex items-center gap-3 ml-2">
              <Button
                asChild
                variant="ghost"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="text-sm font-medium"
              >
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2.5 rounded-full pl-2 pr-4 hover:bg-muted/50 h-9"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px] font-semibold bg-muted text-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {user?.name?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "Account"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/trips" className="cursor-pointer flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" /> Reservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="cursor-pointer flex items-center gap-2">
                    <Heart className="size-4 text-muted-foreground" /> Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/vendor" className="cursor-pointer flex items-center gap-2">
                    <Store className="size-4 text-muted-foreground" /> Vendor Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vendor/subscription" className="cursor-pointer flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" /> Manage Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          {token && (
            <NotificationBell />
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            className="flex size-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="flex flex-col border-t border-border bg-background px-6 py-4 gap-1 md:hidden animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          
          {!token ? (
            <div className="flex flex-col gap-3 pt-2">
              <Button asChild variant="outline" className="w-full justify-center h-12">
                <Link href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
              </Button>
              <Button asChild className="w-full justify-center h-12">
                <Link href="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {mobileLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </Link>
              ))}
              <div className="my-3 h-px bg-border" />
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-3 rounded-md px-4 py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 w-full text-left"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
