"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, Pencil1Icon, PlusIcon, TrashIcon, UploadIcon } from "@radix-ui/react-icons";
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
      <div className="mx-auto max-w-[900px] px-6 py-12">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="mt-8 h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-24 pt-12">
      <section className="border-b border-border pb-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vendor settings</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-foreground">Payment details</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          Add how customers should pay you. At least one active method is required before you can publish listings and
          accept reservations.
        </p>

        {needsPaymentDetails ? (
          <div className="mt-6 max-w-2xl rounded-xl border border-amber-400/40 bg-amber-50/50 px-5 py-4 dark:bg-amber-950/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Action required
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Add at least one active payment method to unlock publishing and reservations.
            </p>
          </div>
        ) : (
          <div className="mt-6 inline-flex rounded-full border border-emerald-400/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            {activeCount} active method{activeCount === 1 ? "" : "s"}
          </div>
        )}
      </section>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">GCash, Maya, bank transfer, or custom instructions with optional QR.</p>
        <Button type="button" onClick={openCreateDialog} className="shrink-0 gap-2">
          <PlusIcon className="size-3.5" />
          Add method
        </Button>
      </div>

      {methods.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-card px-8 py-16 text-center">
          <p className="font-display text-3xl font-semibold text-foreground">No payment methods yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            Customers will see these details when they pay you at checkout.
          </p>
          <Button type="button" onClick={openCreateDialog} className="mt-6">
            Add your first method
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {methods.map((method) => (
            <article
              key={method.id}
              className="rounded-xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl font-semibold text-foreground">{method.label}</p>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {PAYMENT_METHOD_TYPE_LABELS[method.method_type]}
                    </span>
                    {method.is_active === false ? (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.account_name} · {method.account_number}
                  </p>
                  {method.bank_name ? (
                    <p className="text-sm text-muted-foreground">Bank: {method.bank_name}</p>
                  ) : null}
                  {method.instructions ? (
                    <p className="text-sm leading-6 text-muted-foreground">{method.instructions}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(method)}>
                    <Pencil1Icon className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === method.id}
                    onClick={() => void handleDelete(method)}
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon className="size-3.5" />
                    {deletingId === method.id ? "Removing" : "Delete"}
                  </Button>
                </div>
              </div>

              {method.qr_image_url ? (
                <div className="mt-4 inline-block overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
                  <img
                    src={resolveApiAsset(method.qr_image_url)}
                    alt={`${method.label} QR code`}
                    className="h-32 w-32 object-contain"
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Need to configure delivery options?{" "}
        <Link href="/vendor/inventory" className="font-semibold text-primary underline-offset-2 hover:underline">
          Open inventory fulfillment studio
        </Link>
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit payment method" : "Add payment method"}</DialogTitle>
            <DialogDescription>
              Share account details customers need to pay you. QR images are optional but helpful for GCash and Maya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="method_type">Method type</Label>
              <select
                id="method_type"
                value={form.method_type}
                onChange={(event) => handleTypeChange(event.target.value as VendorPaymentMethodType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {METHOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PAYMENT_METHOD_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Display label</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="e.g. GCash — Main account"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account name</Label>
                <Input
                  id="account_name"
                  value={form.account_name}
                  onChange={(event) => setForm((current) => ({ ...current, account_name: event.target.value }))}
                  placeholder="Name on account"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">
                  {form.method_type === "BANK" ? "Account number" : "Mobile / account number"}
                </Label>
                <Input
                  id="account_number"
                  value={form.account_number}
                  onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))}
                  placeholder={form.method_type === "GCASH" || form.method_type === "MAYA" ? "09XX XXX XXXX" : "Number"}
                />
              </div>
            </div>

            {form.method_type === "BANK" ? (
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank name</Label>
                <Input
                  id="bank_name"
                  value={form.bank_name || ""}
                  onChange={(event) => setForm((current) => ({ ...current, bank_name: event.target.value }))}
                  placeholder="e.g. BDO, BPI"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (optional)</Label>
              <textarea
                id="instructions"
                value={form.instructions || ""}
                onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Any extra payment notes for customers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr_image">QR code image (optional)</Label>
              <label
                htmlFor="qr_image"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:bg-muted/40",
                  qrPreview && "border-solid"
                )}
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active !== false}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                className="size-4 rounded border-border"
              />
              Active — visible to customers at checkout
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add method"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
