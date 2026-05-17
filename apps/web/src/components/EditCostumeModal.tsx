"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createEmptyVendorCostumeDraft,
  VendorCostumeFormFields,
  type VendorCostumeDraft,
} from "@/components/vendor/VendorCostumeFormFields";
import { useAuth } from "@/lib/auth";
import { type VendorCostume, updateVendorCostume } from "@/lib/vendor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditCostumeModalProps {
  costume: VendorCostume | null;
  onClose: () => void;
  onSuccess: () => void;
}

function mapCostumeToDraft(costume: VendorCostume): VendorCostumeDraft {
  const existingImages = costume.CostumeImages || [];

  return {
    name: costume.name || "",
    description: costume.description || "",
    price: costume.base_price_per_day?.toString() || "",
    deposit: costume.deposit_amount?.toString() || "",
    stock: costume.stock?.toString() || "1",
    size: costume.size || "",
    category: costume.category || "",
    gender: costume.gender || "",
    theme: costume.theme || "",
    images: existingImages.map((image) => image.image_url),
  };
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

export function EditCostumeModal({ costume, onClose, onSuccess }: EditCostumeModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<VendorCostumeDraft>(createEmptyVendorCostumeDraft());

  useEffect(() => {
    if (costume) {
      setDraft(mapCostumeToDraft(costume));
    } else {
      setDraft(createEmptyVendorCostumeDraft());
    }
  }, [costume]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !costume) return;

    if (draft.images.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }

    setSubmitting(true);
    try {
      await updateVendorCostume(costume.id, buildPayload(draft));
      toast.success("Listing updated.");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update costume.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!costume) return null;

  return (
    <Dialog
      open={!!costume}
      onOpenChange={(value: boolean) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="border-b border-border pb-5">
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>
            Refine the storefront copy, pricing, stock, and imagery so the listing stays accurate
            at every status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <VendorCostumeFormFields draft={draft} onDraftChange={setDraft} />

          <DialogFooter className="border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={submitting}>
              {submitting ? "Saving changes..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
