"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil1Icon, PlusIcon, TrashIcon, UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveApiAsset } from "@/lib/assets";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getVendorProfile,
  listMyPaymentMethods,
  PAYMENT_METHOD_TYPE_LABELS,
  updatePaymentMethod,
  type VendorPaymentMethod,
  type VendorPaymentMethodPayload,
  type VendorPaymentMethodType,
  type VendorProfile
} from "@/lib/vendor";

const METHOD_TYPES: VendorPaymentMethodType[] = ["GCASH", "MAYA", "BANK", "OTHER"];

function defaultLabelForType(type: VendorPaymentMethodType) {
  return PAYMENT_METHOD_TYPE_LABELS[type];
}

function emptyForm(type: VendorPaymentMethodType = "GCASH"): VendorPaymentMethodPayload {
  return {
    method_type: type,
    label: defaultLabelForType(type),
    account_name: "",
    account_number: "",
    bank_name: "",
    instructions: "",
    is_active: true,
    qr_image: null
  };
}

function formFromMethod(method: VendorPaymentMethod): VendorPaymentMethodPayload {
  return {
    method_type: method.method_type,
    label: method.label,
    account_name: method.account_name,
    account_number: method.account_number,
    bank_name: method.bank_name || "",
    instructions: method.instructions || "",
    is_active: method.is_active !== false,
    sort_order: method.sort_order,
    qr_image: null
  };
}

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [methods, setMethods] = useState<VendorPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorPaymentMethod | null>(null);
  const [form, setForm] = useState<VendorPaymentMethodPayload>(emptyForm());
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const [profileData, methodData] = await Promise.all([getVendorProfile(), listMyPaymentMethods()]);
    setProfile(profileData);
    setMethods(methodData);
  }, []);

  useEffect(() => {
    if (!user) return;

    void refresh()
      .catch(() => toast.error("Failed to load payment settings."))
      .finally(() => setLoading(false));
  }, [user, refresh]);

  const needsPaymentDetails = profile?.blockingReasons.includes("PAYMENT_DETAILS_REQUIRED") ?? false;
  const activeCount = useMemo(() => methods.filter((method) => method.is_active !== false).length, [methods]);
  const inactiveCount = methods.length - activeCount;
  const storeName = profile?.profile?.business_name?.trim() || "your atelier";

  function openCreateDialog() {
    setEditing(null);
    setForm(emptyForm());
    setQrPreview(null);
    setDialogOpen(true);
  }

  function openEditDialog(method: VendorPaymentMethod) {
    setEditing(method);
    setForm(formFromMethod(method));
    setQrPreview(method.qr_image_url ? resolveApiAsset(method.qr_image_url) : null);
    setDialogOpen(true);
  }

  function handleTypeChange(type: VendorPaymentMethodType) {
    setForm((current) => ({
      ...current,
      method_type: type,
      label: current.label === defaultLabelForType(current.method_type) ? defaultLabelForType(type) : current.label
    }));
  }

  function handleQrChange(file: File | null) {
    setForm((current) => ({ ...current, qr_image: file }));
    if (qrPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(qrPreview);
    }
    setQrPreview(file ? URL.createObjectURL(file) : editing?.qr_image_url ? resolveApiAsset(editing.qr_image_url) : null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updatePaymentMethod(editing.id, form);
        toast.success("Payment method updated.");
      } else {
        await createPaymentMethod(form);
        toast.success("Payment method added.");
      }
      setDialogOpen(false);
      await refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to save payment method.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(method: VendorPaymentMethod) {
    setDeletingId(method.id);
    try {
      await deletePaymentMethod(method.id);
      toast.success("Payment method removed.");
      await refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to delete payment method.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-md" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Settings
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Payment details
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {needsPaymentDetails
              ? "Add at least one active method so renters can pay you at checkout — and so publishing unlocks."
              : `How customers pay ${storeName}. Keep at least one method active for bookings.`}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              type="button"
              onClick={openCreateDialog}
              className="hover-snap h-11 gap-2 px-6 text-xs font-semibold uppercase tracking-widest shadow-coral"
            >
              <PlusIcon className="size-3.5" />
              Add method
            </Button>
            <Link
              href="/vendor/inventory?fulfillment=open"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              Delivery settings
            </Link>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Payment status">
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active</dt>
            <dd
              className={cn(
                "font-display text-xl font-semibold tabular-nums",
                activeCount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
              )}
            >
              {activeCount}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">On file</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">{methods.length}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Publishing</dt>
            <dd
              className={cn(
                "font-display text-xl font-semibold",
                needsPaymentDetails ? "text-amber-700 dark:text-amber-400" : "text-foreground"
              )}
            >
              {needsPaymentDetails ? "Locked" : "Ready"}
            </dd>
          </div>
        </dl>
      </header>

      {needsPaymentDetails ? (
        <div className="mb-8 max-w-3xl rounded-xl border border-amber-400/40 bg-amber-50/50 px-5 py-4 dark:bg-amber-950/20">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Action required
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Publishing and reservations stay locked until customers can see how to pay you — GCash, Maya, bank, or custom instructions.
          </p>
          <Button
            type="button"
            onClick={openCreateDialog}
            className="mt-3 h-10 px-5 text-[10px] font-semibold uppercase tracking-widest shadow-coral"
          >
            Add your first method
          </Button>
        </div>
      ) : null}

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Methods
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
              Payment methods
            </h2>
            {inactiveCount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {inactiveCount} inactive method{inactiveCount === 1 ? "" : "s"} hidden from checkout
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                GCash, Maya, bank transfer, or custom instructions with optional QR.
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openCreateDialog}
            className="h-11 gap-2 px-5 text-xs font-semibold uppercase tracking-widest"
          >
            <PlusIcon className="size-3.5" />
            Add method
          </Button>
        </div>

        {methods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-8 py-14 text-center">
            <p className="font-display text-2xl font-semibold text-foreground md:text-3xl">
              No payment methods yet
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Customers see these details when they pay you at checkout. Start with the wallet or bank you use most.
            </p>
            <Button
              type="button"
              onClick={openCreateDialog}
              className="mt-6 h-11 px-6 text-xs font-semibold uppercase tracking-widest shadow-coral"
            >
              Add your first method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => {
              const isActive = method.is_active !== false;
              return (
                <article
                  key={method.id}
                  className={cn(
                    "settings-method-card rounded-xl border bg-card p-5 sm:p-6",
                    isActive ? "border-border" : "border-border/70 opacity-80"
                  )}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-xl font-semibold text-foreground">
                          {method.label}
                        </p>
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {PAYMENT_METHOD_TYPE_LABELS[method.method_type]}
                        </span>
                        {isActive ? (
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-50/50 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm leading-6 text-muted-foreground">
                        <p>
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                            Account
                          </span>
                          <span className="mt-0.5 block text-foreground">
                            {method.account_name} · {method.account_number}
                          </span>
                        </p>
                        {method.bank_name ? (
                          <p>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                              Bank
                            </span>
                            <span className="mt-0.5 block text-foreground">{method.bank_name}</span>
                          </p>
                        ) : null}
                        {method.instructions ? (
                          <p>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                              Notes
                            </span>
                            <span className="mt-0.5 block max-w-prose">{method.instructions}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(method)}
                        className="h-9 gap-1.5 text-[10px] font-semibold uppercase tracking-widest"
                      >
                        <Pencil1Icon className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deletingId === method.id}
                        onClick={() => void handleDelete(method)}
                        className="h-9 gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="size-3.5" />
                        {deletingId === method.id ? "Removing" : "Delete"}
                      </Button>
                    </div>
                  </div>

                  {method.qr_image_url ? (
                    <div className="mt-5 inline-flex overflow-hidden rounded-xl border border-border bg-muted/30 p-3">
                      <img
                        src={resolveApiAsset(method.qr_image_url)}
                        alt={`${method.label} QR code`}
                        className="h-32 w-32 object-contain"
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Need delivery location and fees?{" "}
        <Link
          href="/vendor/inventory?fulfillment=open"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Open fulfillment settings
        </Link>
        .
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit payment method" : "Add payment method"}
            </DialogTitle>
            <DialogDescription>
              Share the account details customers need at checkout. QR images help for GCash and Maya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="method_type" className="text-xs uppercase tracking-widest text-muted-foreground">
                Method type
              </Label>
              <Select
                value={form.method_type}
                onValueChange={(value: string) => handleTypeChange(value as VendorPaymentMethodType)}
              >
                <SelectTrigger id="method_type" className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PAYMENT_METHOD_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-xs uppercase tracking-widest text-muted-foreground">
                Display label
              </Label>
              <Input
                id="label"
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="e.g. GCash — Main account"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account_name" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Account name
                </Label>
                <Input
                  id="account_name"
                  value={form.account_name}
                  onChange={(event) => setForm((current) => ({ ...current, account_name: event.target.value }))}
                  placeholder="Name on account"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number" className="text-xs uppercase tracking-widest text-muted-foreground">
                  {form.method_type === "BANK" ? "Account number" : "Mobile / account number"}
                </Label>
                <Input
                  id="account_number"
                  value={form.account_number}
                  onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))}
                  placeholder={form.method_type === "GCASH" || form.method_type === "MAYA" ? "09XX XXX XXXX" : "Number"}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {form.method_type === "BANK" ? (
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Bank name
                </Label>
                <Input
                  id="bank_name"
                  value={form.bank_name || ""}
                  onChange={(event) => setForm((current) => ({ ...current, bank_name: event.target.value }))}
                  placeholder="e.g. BDO, BPI"
                  className="h-11 rounded-xl"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-xs uppercase tracking-widest text-muted-foreground">
                Instructions (optional)
              </Label>
              <textarea
                id="instructions"
                value={form.instructions || ""}
                onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                rows={3}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder="Any extra payment notes for customers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr_image" className="text-xs uppercase tracking-widest text-muted-foreground">
                QR code image (optional)
              </Label>
              <label
                htmlFor="qr_image"
                data-filled={qrPreview ? "true" : "false"}
                className="settings-upload-zone flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center"
              >
                {qrPreview ? (
                  <img src={qrPreview} alt="QR preview" className="h-28 w-28 object-contain" />
                ) : (
                  <>
                    <UploadIcon className="size-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">PNG or JPG up to 5MB</span>
                  </>
                )}
                <input
                  id="qr_image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleQrChange(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <label className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active !== false}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                className="size-4 rounded border-border accent-[var(--primary)]"
              />
              <span>
                <span className="font-medium text-foreground">Active</span>
                <span className="text-muted-foreground"> — visible to customers at checkout</span>
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-11">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-11 shadow-coral"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Add method"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
