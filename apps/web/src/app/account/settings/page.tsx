"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Bell,
  Lock,
  MapPin,
  Menu,
  Truck,
  User
} from "lucide-react";
import { GearIcon } from "@radix-ui/react-icons";

import { AddressesPanel } from "@/components/account/AddressesPanel";
import { DeliveryPreferencesPanel } from "@/components/account/DeliveryPreferencesPanel";
import { NotificationsPanel } from "@/components/account/NotificationsPanel";
import { PersonalInfoPanel } from "@/components/account/PersonalInfoPanel";
import { SecurityPanel } from "@/components/account/SecurityPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type SettingsTab = "personal" | "addresses" | "security" | "delivery" | "notifications";

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
  { id: "personal", label: "Personal info", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "security", label: "Security", icon: Lock },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "notifications", label: "Notifications", icon: Bell }
];

function AccountSettingsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-24 pt-16">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="flex gap-8">
        <Skeleton className="hidden h-80 w-64 md:block" />
        <Skeleton className="h-80 flex-1" />
      </div>
    </div>
  );
}

type SettingsSidebarProps = {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  onNavigate?: () => void;
};

function SettingsSidebar({ activeTab, onSelectTab, onNavigate }: SettingsSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Account settings">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSelectTab(id);
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function AccountSettingsPageContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [activeTab, setActiveTab] = useState<SettingsTab>(nextUrl ? "addresses" : "personal");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;
    if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return <AccountSettingsPageSkeleton />;
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 text-center">
        <GearIcon className="mx-auto size-12 text-muted-foreground/30" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">Account settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in to manage your account.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-6 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground"
        >
          Log in
        </Link>
      </div>
    );
  }

  function renderPanel() {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoPanel />;
      case "addresses":
        return <AddressesPanel />;
      case "security":
        return <SecurityPanel />;
      case "delivery":
        return <DeliveryPreferencesPanel nextUrl={nextUrl} />;
      case "notifications":
        return <NotificationsPanel />;
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl">
      <div className="hidden md:flex">
        <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-brand-ink/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex h-full">
            <SettingsSidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 md:hidden">
          <button
            type="button"
            aria-label="Open settings menu"
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl border border-border text-foreground"
          >
            <Menu className="size-4" />
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {TABS.find((tab) => tab.id === activeTab)?.label ?? "Settings"}
          </p>
          <div className="size-9" />
        </div>

        <div className="flex-1 px-6 py-8 md:px-10">{renderPanel()}</div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<AccountSettingsPageSkeleton />}>
      <AccountSettingsPageContent />
    </Suspense>
  );
}
