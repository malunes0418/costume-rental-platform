"use client";

import { ImageIcon } from "@radix-ui/react-icons";

import { WishlistButton } from "@/components/WishlistButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GalleryImage {
  src: string;
  alt: string;
}

interface CostumeStageGalleryProps {
  images: GalleryImage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  category?: string | null;
  costumeId: number;
  ownerId?: number | null;
  isWishlisted: boolean;
  isOwnCostume: boolean;
}

export function CostumeStageGallery({
  images,
  selectedIndex,
  onSelect,
  category,
  costumeId,
  ownerId,
  isWishlisted,
  isOwnCostume
}: CostumeStageGalleryProps) {
  const selectedImage = images[selectedIndex] ?? null;

  return (
    <div className="costume-stage animate-fade-up">
      <div className="pointer-events-none absolute inset-0 costume-stage-spotlight" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 costume-stage-curtain costume-stage-curtain--left" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 costume-stage-curtain costume-stage-curtain--right" aria-hidden="true" />

      <div className="relative grid gap-4 p-3 sm:p-4 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start">
        <div
          className={cn(
            "order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:max-h-[min(72vh,580px)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0",
            images.length === 0 && "hidden"
          )}
          role="tablist"
          aria-label="Costume photos"
        >
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              role="tab"
              onClick={() => onSelect(index)}
              className={cn(
                "group relative shrink-0 overflow-hidden rounded-lg border bg-muted/80 transition-all duration-300",
                "aspect-[3/4] w-[4.5rem] sm:w-20 lg:w-full",
                index === selectedIndex
                  ? "border-primary ring-2 ring-primary/25 shadow-coral"
                  : "border-border/80 opacity-75 hover:opacity-100 hover:border-primary/35"
              )}
              aria-label={`View image ${index + 1}`}
              aria-selected={index === selectedIndex}
            >
              <img
                src={image.src}
                alt={`${image.alt} thumbnail ${index + 1}`}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <div className="relative mx-auto w-full max-w-[600px]">
            <div className="costume-stage-frame flex min-h-[260px] max-h-[min(72vh,580px)] items-center justify-center overflow-hidden rounded-xl">
              {selectedImage ? (
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-h-[min(72vh,580px)] w-full max-w-full object-contain transition-opacity duration-300"
                />
              ) : (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
                  <ImageIcon className="size-14" aria-hidden="true" />
                  <span className="text-xs font-medium">No photos yet</span>
                </div>
              )}
            </div>

            {category ? (
              <Badge
                variant="coralSoft"
                className="pointer-events-none absolute left-3 top-3 rounded-md border-0 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm"
              >
                {category}
              </Badge>
            ) : null}

            {!isOwnCostume ? (
              <div className="absolute right-3 top-3">
                <WishlistButton
                  costumeId={costumeId}
                  ownerId={ownerId ?? 0}
                  initialSaved={isWishlisted}
                  size="md"
                />
              </div>
            ) : null}

            {images.length > 1 ? (
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-border/80 bg-background/90 px-3 py-1 text-[11px] font-semibold tabular-nums text-foreground backdrop-blur-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            ) : null}
          </div>

          {images.length > 0 ? (
            <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {images.length} still{images.length === 1 ? "" : "s"} on the rack
            </p>
          ) : null}
        </div>
      </div>

      <div className="costume-stage-line" aria-hidden="true" />
    </div>
  );
}
