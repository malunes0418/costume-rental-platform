"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FulfillmentOverrideFields, type OverrideChoice } from "@/components/FulfillmentOverrideFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OTHER_CATEGORY,
  PLATFORM_CATEGORIES,
  isPlatformCategory,
} from "@/components/marketplace/constants";
import { updateVendorCostume } from "@/lib/vendor";
import type { PricingMode } from "@/lib/pricing";
import type { CostumeFulfillmentOverrideInput, VendorFulfillmentSettings } from "@/lib/fulfillment";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { X, UploadCloud } from "lucide-react";

interface EditCostumeModalProps {
  costume: any | null;
  onClose: () => void;
  onSuccess: () => void;
  vendorSettings: VendorFulfillmentSettings | null;
}

function buildOverridePayload(
  vendorSettings: VendorFulfillmentSettings | null,
  outboundChoice: OverrideChoice,
  returnChoice: OverrideChoice
): CostumeFulfillmentOverrideInput | null {
  const outboundBase = vendorSettings?.outbound_mode ?? "BOTH";
  const returnBase = vendorSettings?.return_mode ?? "BOTH";
  const outboundMode = outboundChoice === "INHERIT" ? outboundBase : outboundChoice;
  const returnMode = returnChoice === "INHERIT" ? returnBase : returnChoice;

  if (outboundMode === outboundBase && returnMode === returnBase) {
    return null;
  }

  return {
    outbound_mode: outboundMode,
    return_mode: returnMode
  };
}

export function EditCostumeModal({ costume, onClose, onSuccess, vendorSettings }: EditCostumeModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [pricingMode, setPricingMode] = useState<PricingMode>("PER_DAY");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [includedDays, setIncludedDays] = useState("");
  const [unusedDayDiscount, setUnusedDayDiscount] = useState("");
  const [extraDayCharge, setExtraDayCharge] = useState("");
  const [deposit, setDeposit] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [outboundOverride, setOutboundOverride] = useState<OverrideChoice>("INHERIT");
  const [returnOverride, setReturnOverride] = useState<OverrideChoice>("INHERIT");

  useEffect(() => {
    if (costume) {
      setPricingMode(costume.pricing_mode || "PER_DAY");
      setName(costume.name || "");
      setDescription(costume.description || "");
      setPrice(costume.base_price_per_day?.toString() || "");
      setPackagePrice(costume.package_price?.toString() || "");
      setIncludedDays(costume.package_included_days?.toString() || "");
      setUnusedDayDiscount(costume.package_unused_day_discount?.toString() || "");
      setExtraDayCharge(costume.package_extra_day_charge?.toString() || "");
      setDeposit(costume.deposit_amount?.toString() || "");
      setSize(costume.size || "");
      const storedCategory = costume.category || "";
      if (storedCategory && !isPlatformCategory(storedCategory)) {
        setCategory(OTHER_CATEGORY);
        setCategoryLabel(costume.category_label || storedCategory);
      } else {
        setCategory(storedCategory);
        setCategoryLabel(costume.category_label || "");
      }
      setOutboundOverride(costume.fulfillmentOverride?.outbound_mode || "INHERIT");
      setReturnOverride(costume.fulfillmentOverride?.return_mode || "INHERIT");

      const existingImages = costume.CostumeImages || costume.costume_images || [];
      if (Array.isArray(existingImages)) {
        setImages(existingImages.map((img: any) => img.image_url || img));
      } else {
        setImages([]);
      }
    }
  }, [costume]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 15 - images.length;
      const allowedFiles = filesArray.slice(0, remainingSlots);

      if (filesArray.length > remainingSlots) {
        toast.warning(`Only 15 images allowed. Added the first ${remainingSlots}.`);
      }

      const base64Images = await Promise.all(
        allowedFiles.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });
        })
      );

      setImages((prev) => [...prev, ...base64Images]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !costume) return;

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    if (images.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }

    setSubmitting(true);
    try {
      await updateVendorCostume(costume.id, {
        name,
        description,
        pricing_mode: pricingMode,
        base_price_per_day: pricingMode === "PER_DAY" ? parseFloat(price) : null,
        package_price: pricingMode === "PACKAGE" ? parseFloat(packagePrice) : null,
        package_included_days: pricingMode === "PACKAGE" ? parseFloat(includedDays) : null,
        package_unused_day_discount: pricingMode === "PACKAGE" ? parseFloat(unusedDayDiscount) : null,
        package_extra_day_charge: pricingMode === "PACKAGE" ? parseFloat(extraDayCharge) : null,
        deposit_amount: parseFloat(deposit) || 0,
        size,
        category,
        category_label:
          category === OTHER_CATEGORY ? categoryLabel.trim() || null : null,
        images,
        fulfillment_override: buildOverridePayload(vendorSettings, outboundOverride, returnOverride)
      });

      toast.success("Costume updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update costume.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!costume) return null;

  return (
    <Dialog
      open={!!costume}
      onOpenChange={(val: boolean) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Costume</DialogTitle>
          <DialogDescription>
            Update the details and pictures for this listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Costume Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                placeholder="e.g. Victorian Vampire"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category || undefined}
                onValueChange={(value) => {
                  setCategory(value);
                  if (value !== OTHER_CATEGORY) setCategoryLabel("");
                }}
              >
                <SelectTrigger id="edit-category" className="h-11 w-full rounded-sm">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_CATEGORIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category === OTHER_CATEGORY ? (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-category-label">Custom label</Label>
                <Input
                  id="edit-category-label"
                  placeholder="Optional display label (e.g. Cosplay mashup)"
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Shown to shoppers; browse filtering still uses Other.
                </p>
              </div>
            ) : null}

            <div className="space-y-3 md:col-span-2">
              <Label>Pricing Mode <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={pricingMode === "PER_DAY" ? "default" : "outline"}
                  onClick={() => setPricingMode("PER_DAY")}
                  className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
                >
                  <span>Per day</span>
                  <span className="text-[10px] font-normal uppercase tracking-wider opacity-80">
                    Daily rate x rental days
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={pricingMode === "PACKAGE" ? "default" : "outline"}
                  onClick={() => setPricingMode("PACKAGE")}
                  className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
                >
                  <span>Package</span>
                  <span className="text-[10px] font-normal uppercase tracking-wider opacity-80">
                    Included days with custom adjustments
                  </span>
                </Button>
              </div>
            </div>

            {pricingMode === "PER_DAY" ? (
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price per day (PHP) <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-package-price">Package price (PHP) <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-package-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1500.00"
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-included-days">Included days <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-included-days"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="3"
                    value={includedDays}
                    onChange={(e) => setIncludedDays(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-unused-day-discount">Unused-day discount (PHP) <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-unused-day-discount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100.00"
                    value={unusedDayDiscount}
                    onChange={(e) => setUnusedDayDiscount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-extra-day-charge">Extra-day charge (PHP) <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-extra-day-charge"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="250.00"
                    value={extraDayCharge}
                    onChange={(e) => setExtraDayCharge(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-deposit">Security Deposit (PHP)</Label>
              <Input
                id="edit-deposit"
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-size">Size</Label>
              <Input
                id="edit-size"
                placeholder="e.g. Medium, US 8, Adjustable"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Detailed description of the costume..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {pricingMode === "PACKAGE" ? (
              <div className="rounded-md border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground md:col-span-2">
                This costume will use the package price for the included days, then adjust automatically for shorter or longer rentals.
              </div>
            ) : null}
          </div>

          <FulfillmentOverrideFields
            vendorSettings={vendorSettings}
            outboundValue={outboundOverride}
            returnValue={returnOverride}
            onOutboundChange={setOutboundOverride}
            onReturnChange={setReturnOverride}
          />

          <div className="space-y-4 border-t border-border/50 pt-2">
            <div>
              <Label>Pictures ({images.length}/15) <span className="text-destructive">*</span></Label>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">Upload clear, high-quality images of the costume.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted">
                  <img src={img} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3 text-foreground" />
                  </button>
                  {i === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                      Primary
                    </span>
                  )}
                </div>
              ))}

              {images.length < 15 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
                  <UploadCloud className="mb-2 size-6 text-primary/50" />
                  <span className="text-xs font-medium text-primary/80">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 pt-6">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
