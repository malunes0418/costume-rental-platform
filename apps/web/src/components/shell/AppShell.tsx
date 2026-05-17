"use client";

import Link from "next/link";
import { type ComponentType, type ReactNode, useMemo, useState } from "react";
import { ExitIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
  meta?: string;
};

type ShellHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  actions?: ReactNode;
  menuButton?: ReactNode;
  density?: "vendor" | "admin";
};

type AppShellProps = {
  brandCaption: string;
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  actions?: ReactNode;
  navItems: ShellNavItem[];
  pathname: string;
  accountName: string;
  accountEmail?: string;
  initials: string;
  onLogout: () => void;
  children: ReactNode;
  density?: "vendor" | "admin";
  homeHref?: string;
  homeLabel?: string;
};

const GROUP_LABELS: Record<string, string> = {
  core: "Core",
  operations: "Operations",
  governance: "Governance",
};

function ShellHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  menuButton,
  density = "vendor",
}: ShellHeaderProps) {
  return (
    <section
      className={cn(
        "surface-shell sticky top-3 z-40 rounded-[var(--radius-xl)] px-4 py-4 md:px-5",
        density === "admin" && "bg-[color:color-mix(in_oklab,var(--color-card)_94%,var(--color-background))]"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {menuButton}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </p>
              {badge}
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
              {title}
            </h1>
            <p className="mt-1 max-w-[70ch] text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

function SidebarContent({
  brandCaption,
  navItems,
  pathname,
  accountName,
  accountEmail,
  initials,
  onLogout,
  density = "vendor",
  homeHref = "/",
  homeLabel = "Storefront",
  onNavigate,
}: Omit<AppShellProps, "children" | "eyebrow" | "title" | "description" | "badge" | "actions"> & {
  onNavigate?: () => void;
}) {
  const groupedItems = useMemo(() => {
    const groups = new Map<string, ShellNavItem[]>();

    for (const item of navItems) {
      const items = groups.get(item.group) ?? [];
      items.push(item);
      groups.set(item.group, items);
    }

    return Array.from(groups.entries());
  }, [navItems]);

  return (
    <aside
      className={cn(
        "surface-shell flex h-full w-[18.5rem] shrink-0 flex-col overflow-hidden rounded-[var(--radius-xl)]",
        density === "admin"
          ? "bg-[color:color-mix(in_oklab,var(--color-card)_95%,var(--color-background))]"
          : "bg-[color:color-mix(in_oklab,var(--color-brand)_2%,var(--color-card))]"
      )}
    >
      <div className="border-b border-border/80 px-5 py-5">
        <Link href="/" aria-label="SnapCos home" onClick={onNavigate} className="inline-flex">
          <BrandLogo size="sm" />
        </Link>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {brandCaption}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-5" aria-label={`${brandCaption} navigation`}>
          {groupedItems.map(([groupName, items]) => (
            <div key={groupName} className="space-y-2">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {GROUP_LABELS[groupName] ?? groupName}
              </p>
              <div className="space-y-1">
                {items.map(({ href, label, icon: Icon, meta }) => {
                  const isActive = href === "/vendor" || href === "/admin"
                    ? pathname === href
                    : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-[var(--radius-md)] border px-3 py-3 transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)]",
                        isActive
                          ? "border-[color:color-mix(in_oklab,var(--color-brand)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_7%,var(--color-card))] text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-accent/55 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-9 items-center justify-center rounded-[var(--radius-sm)] border",
                            isActive
                              ? "border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_10%,var(--color-card))] text-[color:var(--color-brand)]"
                              : "border-border/80 bg-card text-muted-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-none text-inherit">{label}</p>
                          {meta ? (
                            <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border/80 px-4 py-4">
        <div className="rounded-[var(--radius-lg)] border border-border/80 bg-[color:color-mix(in_oklab,var(--color-background)_35%,var(--color-card))] p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-bold uppercase text-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{accountName}</p>
              {accountEmail ? (
                <p className="truncate text-xs text-muted-foreground">{accountEmail}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={homeHref}
              onClick={onNavigate}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
            >
              {homeLabel}
            </Link>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full justify-center"
              onClick={onLogout}
            >
              <ExitIcon className="size-3.5" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({
  brandCaption,
  eyebrow,
  title,
  description,
  badge,
  actions,
  navItems,
  pathname,
  accountName,
  accountEmail,
  initials,
  onLogout,
  children,
  density = "vendor",
  homeHref = "/",
  homeLabel = "Storefront",
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px] gap-4 px-3 py-3 md:px-4 md:py-4">
        <div className="hidden lg:block">
          <div className="sticky top-3 h-[calc(100vh-1.5rem)]">
            <SidebarContent
              brandCaption={brandCaption}
              navItems={navItems}
              pathname={pathname}
              accountName={accountName}
              accountEmail={accountEmail}
              initials={initials}
              onLogout={onLogout}
              density={density}
              homeHref={homeHref}
              homeLabel={homeLabel}
            />
          </div>
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-[color:color-mix(in_oklab,var(--color-foreground)_18%,transparent)] backdrop-blur-[3px]"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative h-full max-w-[19rem] p-3">
              <SidebarContent
                brandCaption={brandCaption}
                navItems={navItems}
                pathname={pathname}
                accountName={accountName}
                accountEmail={accountEmail}
                initials={initials}
                onLogout={onLogout}
                density={density}
                homeHref={homeHref}
                homeLabel={homeLabel}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ShellHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            badge={badge}
            density={density}
            menuButton={
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setSidebarOpen(true)}
                className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent lg:hidden"
              >
                <HamburgerMenuIcon className="size-4" />
              </button>
            }
            actions={actions}
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

export { ShellHeader };
