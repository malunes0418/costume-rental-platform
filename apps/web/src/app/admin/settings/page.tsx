"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  adminGetSettings,
  adminUpdateSettings,
  type AdminPlatformSettings,
} from "@/lib/admin";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feePercent, setFeePercent] = useState("10");
  const [flags, setFlags] = useState<AdminPlatformSettings["feature_flags"]>({
    moderation_enabled: true,
    disputes_enabled: true,
    payouts_enabled: true,
  });

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    adminGetSettings()
      .then((settings) => {
        setFeePercent(String(Math.round(settings.platform_fee_rate * 10000) / 100));
        setFlags(settings.feature_flags);
      })
      .catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, [user]);

  async function save() {
    const rate = Number(feePercent) / 100;
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      toast.error("Fee rate must be between 0% and 100%.");
      return;
    }
    setSaving(true);
    try {
      const updated = await adminUpdateSettings({
        platform_fee_rate: rate,
        feature_flags: flags,
      });
      setFeePercent(String(Math.round(updated.platform_fee_rate * 10000) / 100));
      setFlags(updated.feature_flags);
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full max-w-xl rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Platform fee rate and feature flags for ops modules."
      />

      <div className="max-w-xl space-y-6 rounded-xl border border-border bg-card p-6">
        <label className="block space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Platform fee rate (%)
          </span>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={feePercent}
            onChange={(e) => setFeePercent(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Applied to vendor earnings and new payout entries. Default 10%.
          </p>
        </label>

        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Feature flags
          </p>
          {(
            [
              ["moderation_enabled", "Moderation module"],
              ["disputes_enabled", "Disputes module"],
              ["payouts_enabled", "Payouts module"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
                className="size-4 accent-[var(--primary)]"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-primary px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
