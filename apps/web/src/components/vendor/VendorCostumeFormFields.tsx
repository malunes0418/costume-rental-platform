"use client";

import { UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveApiAsset } from "@/lib/assets";

export type VendorCostumeDraft = {
  name: string;
  description: string;
  price: string;
  deposit: string;
  stock: string;
  size: string;
  category: string;
  gender: string;
  theme: string;
  images: string[];
};

type VendorCostumeFormFieldsProps = {
  draft: VendorCostumeDraft;
  onDraftChange: (draft: VendorCostumeDraft) => void;
};

export function createEmptyVendorCostumeDraft(): VendorCostumeDraft {
  return {
    name: "",
    description: "",
    price: "",
    deposit: "",
    stock: "1",
    size: "",
    category: "",
    gender: "",
    theme: "",
    images: [],
  };
}

function resolvePreviewImage(src: string) {
  return src.startsWith("data:") ? src : resolveApiAsset(src);
}

export function VendorCostumeFormFields({
  draft,
  onDraftChange,
}: VendorCostumeFormFieldsProps) {
  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;

    const filesArray = Array.from(event.target.files);
    const remainingSlots = 15 - draft.images.length;
    const allowedFiles = filesArray.slice(0, remainingSlots);

    if (filesArray.length > remainingSlots) {
      toast.warning(`Only 15 images allowed. Added the first ${remainingSlots}.`);
    }

    const base64Images = await Promise.all(
      allowedFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = (error) => reject(error);
          })
      )
    );

    onDraftChange({ ...draft, images: [...draft.images, ...base64Images] });
    event.target.value = "";
  }

  function updateField<K extends keyof VendorCostumeDraft>(key: K, value: VendorCostumeDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  function removeImage(index: number) {
    onDraftChange({
      ...draft,
      images: draft.images.filter((_, imageIndex) => imageIndex !== index),
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label
            htmlFor="costume-name"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Costume name
          </Label>
          <Input
            id="costume-name"
            placeholder="Victorian Vampire"
            value={draft.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-category"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Category
          </Label>
          <Input
            id="costume-category"
            placeholder="Historical"
            value={draft.category}
            onChange={(event) => updateField("category", event.target.value)}
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-theme"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Theme
          </Label>
          <Input
            id="costume-theme"
            placeholder="Gothic"
            value={draft.theme}
            onChange={(event) => updateField("theme", event.target.value)}
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-size"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Size
          </Label>
          <Input
            id="costume-size"
            placeholder="Medium"
            value={draft.size}
            onChange={(event) => updateField("size", event.target.value)}
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-gender"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Gender fit
          </Label>
          <Input
            id="costume-gender"
            placeholder="Flexible"
            value={draft.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-price"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Price per day (PHP)
          </Label>
          <Input
            id="costume-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="2500"
            value={draft.price}
            onChange={(event) => updateField("price", event.target.value)}
            required
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-deposit"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Deposit (PHP)
          </Label>
          <Input
            id="costume-deposit"
            type="number"
            min="0"
            step="0.01"
            placeholder="1000"
            value={draft.deposit}
            onChange={(event) => updateField("deposit", event.target.value)}
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="costume-stock"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Available units
          </Label>
          <Input
            id="costume-stock"
            type="number"
            min="1"
            step="1"
            placeholder="1"
            value={draft.stock}
            onChange={(event) => updateField("stock", event.target.value)}
            className="h-12 rounded-[var(--radius-md)] bg-background"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label
            htmlFor="costume-description"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
          >
            Listing description
          </Label>
          <textarea
            id="costume-description"
            rows={5}
            placeholder="Describe the silhouette, fit, condition, and the kind of event this piece suits best."
            value={draft.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="min-h-32 w-full resize-y rounded-[var(--radius-md)] border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-ring/60 focus:ring-4 focus:ring-ring/14"
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-5">
        <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Listing images
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Upload up to 15 images. The first image is treated as the primary storefront image.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
            {draft.images.length}/15
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-5">
          {draft.images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-muted"
            >
              <img
                src={resolvePreviewImage(image)}
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full border border-border bg-background/92 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
              <span className="absolute inset-x-0 bottom-0 bg-[color:color-mix(in_oklab,var(--color-brand)_88%,black_12%)] px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-foreground">
                {index === 0 ? "Primary image" : `Image ${index + 1}`}
              </span>
            </div>
          ))}

          {draft.images.length < 15 ? (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[color:color-mix(in_oklab,var(--color-brand)_24%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_5%,var(--color-background))] px-4 text-center transition-colors hover:bg-[color:color-mix(in_oklab,var(--color-brand)_9%,var(--color-background))]">
              <UploadCloud className="size-6 text-[color:var(--color-brand)]" />
              <span className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-foreground">
                Upload
              </span>
              <span className="mt-1 text-xs leading-5 text-muted-foreground">PNG, JPG, or WEBP</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
