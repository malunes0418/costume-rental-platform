"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  createEmptyVendorCostumeDraft,
  VendorCostumeFormFields,
  type VendorCostumeDraft,
} from "@/components/vendor/VendorCostumeFormFields";
import { useAuth } from "@/lib/auth";
import { createVendorCostume } from "@/lib/vendor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddCostumeModalProps {
  onSuccess: () => void;
  disabled?: boolean;
}

function buildPayload(draft: VendorCostumeDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    category: draft.category.trim() || undefined,
    size: draft.size.trim() || undefined,
    gender: draft.gender.trim() || undefined,
    theme: draft.theme.trim() || undefined,
    base_price_per_day: Number(draft.price),
    deposit_amount: Number(draft.deposit) || 0,
    stock: Number(draft.stock) || 1,
    images: draft.images,
  };
}

export function AddCostumeModal({ onSuccess, disabled }: AddCostumeModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<VendorCostumeDraft>(createEmptyVendorCostumeDraft());

  function resetForm() {
    setDraft(createEmptyVendorCostumeDraft());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    if (draft.images.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }

    setSubmitting(true);
    try {
      await createVendorCostume(buildPayload(draft));
      toast.success("Listing created in draft mode.");
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to add costume.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value: boolean) => {
        setOpen(value);
        if (!value) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" disabled={disabled}>
          <Plus className="size-4" />
          Add listing
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="border-b border-border pb-5">
          <DialogTitle>Create a new listing</DialogTitle>
          <DialogDescription>
            Add the essentials first, keep the listing in draft, and publish only when the imagery
            and copy are strong enough to represent your collection well.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <VendorCostumeFormFields draft={draft} onDraftChange={setDraft} />

          <DialogFooter className="border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={submitting}>
              {submitting ? "Saving draft..." : "Save listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
