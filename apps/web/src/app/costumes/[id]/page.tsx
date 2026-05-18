"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  ExclamationTriangleIcon as AlertCircle,
  ImageIcon
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { SavedLocationFields } from "@/components/SavedLocationFields";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { addReservationToCart, listSavedLocations } from "../../../lib/account";
import { ApiError } from "../../../lib/api";
import { resolveApiAsset } from "../../../lib/assets";
import { useAuth } from "../../../lib/auth";
import { useCart } from "../../../lib/CartContext";
import {
  FULFILLMENT_METHOD_LABELS,
  FULFILLMENT_WINDOW_LABELS,
  modeAllowsMethod,
  type FulfillmentMethod,
  type FulfillmentWindowSlot,
  type ReservationFulfillmentSelectionInput,
  type SavedLocation,
  type SavedLocationInput
} from "../../../lib/fulfillment";
import {
  getAvailability,
  getCostume,
  listCostumeReviews,
  type CostumeDetailResponse,
  type Review
} from "../../../lib/costumes";
import {
  calculateCostumePrice,
  countRentalDaysInclusive,
  getCostumePricingSummary
} from "../../../lib/pricing";
import { cn } from "../../../lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  maximumFractionDigits: 0
});

const WINDOW_OPTIONS: FulfillmentWindowSlot[] = ["MORNING", "AFTERNOON", "EVENING"];

function fmtMoney(value: number) {
  return `PHP ${currencyFormatter.format(Number(value) || 0)}`;
}

function formatReviewDate(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

function emptyLocationDraft(): SavedLocationInput {
  return {
    label: "",
    contact_name: "",
    phone_number: "",
    address_line_1: "",
    address_line_2: "",
    barangay: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Philippines",
    area: "",
    notes: "",
    is_default: false
  };
}

function methodOptionsForMode(mode: CostumeDetailResponse["effective_fulfillment"]["outbound_mode"]) {
  return (["PICKUP", "DELIVERY"] as FulfillmentMethod[]).filter((method) => modeAllowsMethod(mode, method));
}

function locationComplete(location: SavedLocationInput) {
  return (
    location.label.trim() &&
    location.contact_name.trim() &&
    location.phone_number.trim() &&
    location.address_line_1.trim() &&
    location.city.trim()
  );
}

export default function CostumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, triggerRefresh } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CostumeDetailResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [shouldAutoOpenEndDate, setShouldAutoOpenEndDate] = useState(false);

  const [outboundMethod, setOutboundMethod] = useState<FulfillmentMethod>("PICKUP");
  const [returnMethod, setReturnMethod] = useState<FulfillmentMethod>("PICKUP");
  const [pickupWindowSlot, setPickupWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [deliveryWindowSlot, setDeliveryWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [returnWindowSlot, setReturnWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [outboundLocationMode, setOutboundLocationMode] = useState<"saved" | "new">("saved");
  const [returnLocationMode, setReturnLocationMode] = useState<"saved" | "new">("saved");
  const [selectedOutboundLocationId, setSelectedOutboundLocationId] = useState<number | null>(null);
  const [selectedReturnLocationId, setSelectedReturnLocationId] = useState<number | null>(null);
  const [newOutboundLocation, setNewOutboundLocation] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [newReturnLocation, setNewReturnLocation] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [useSameLocationForReturn, setUseSameLocationForReturn] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getCostume(id), listCostumeReviews(id)])
      .then(([detail, nextReviews]) => {
        if (cancelled) return;
        setData(detail);
        setReviews(nextReviews);
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setError(nextError instanceof ApiError ? nextError.message : "Failed to load costume");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!user || user.role === "ADMIN") {
      setSavedLocations([]);
      return;
    }

    let cancelled = false;
    listSavedLocations()
      .then((locations) => {
        if (cancelled) return;
        setSavedLocations(locations);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam) {
      const parsed = new Date(startDateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setStartDate(parsed);
      }
    }

    if (endDateParam) {
      const parsed = new Date(endDateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setEndDate(parsed);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!data) return;

    const outboundOptions = methodOptionsForMode(data.effective_fulfillment.outbound_mode);
    const returnOptions = methodOptionsForMode(data.effective_fulfillment.return_mode);

    setOutboundMethod((current) => (outboundOptions.includes(current) ? current : outboundOptions[0] || "PICKUP"));
    setReturnMethod((current) => (returnOptions.includes(current) ? current : returnOptions[0] || "PICKUP"));
  }, [data]);

  useEffect(() => {
    const defaultLocation = savedLocations.find((location) => location.is_default) || savedLocations[0];
    if (!defaultLocation) {
      setOutboundLocationMode("new");
      setReturnLocationMode("new");
      return;
    }

    setSelectedOutboundLocationId((current) => current ?? defaultLocation.id);
    setSelectedReturnLocationId((current) => current ?? defaultLocation.id);
  }, [savedLocations]);

  const images = data?.costume.CostumeImages ?? [];
  const galleryImages = images.map((image) => ({
    src: resolveApiAsset(image.image_url),
    alt: data?.costume.name || "Costume image"
  }));
  const selectedImage = galleryImages[selectedImageIndex] ?? null;
  const isOwnCostume = Boolean(user && data?.costume.owner_id === user.id);

  useEffect(() => {
    setSelectedImageIndex((currentIndex) => (currentIndex >= galleryImages.length ? 0 : currentIndex));
  }, [galleryImages.length]);

  useEffect(() => {
    if (isStartDateOpen || !shouldAutoOpenEndDate) return;

    const timer = window.setTimeout(() => {
      setIsEndDateOpen(true);
      setShouldAutoOpenEndDate(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isStartDateOpen, shouldAutoOpenEndDate]);

  const rentalDays = useMemo(
    () => (startDate && endDate ? countRentalDaysInclusive(startDate, endDate) : 0),
    [startDate, endDate]
  );
  const pricingSummary = useMemo(
    () => (data ? getCostumePricingSummary(data.costume) : null),
    [data]
  );
  const quote = useMemo(
    () => (data && rentalDays > 0 ? calculateCostumePrice(data.costume, rentalDays) : null),
    [data, rentalDays]
  );
  const fulfillmentFees = useMemo(() => {
    if (!data) return 0;

    const outboundFee =
      outboundMethod === "PICKUP"
        ? Number(data.effective_fulfillment.outbound_pickup_fee)
        : Number(data.effective_fulfillment.outbound_delivery_fee);
    const returnFee =
      returnMethod === "PICKUP"
        ? Number(data.effective_fulfillment.return_pickup_fee)
        : Number(data.effective_fulfillment.return_delivery_fee);

    return outboundFee + returnFee;
  }, [data, outboundMethod, returnMethod]);
  const totalPreview = useMemo(() => Number(quote?.subtotal || 0) + fulfillmentFees, [quote, fulfillmentFees]);

  const vendorLocationLine = useMemo(() => {
    if (!data?.effective_fulfillment.primary_location) return null;
    return [
      data.effective_fulfillment.primary_location.address_line_1,
      data.effective_fulfillment.primary_location.barangay,
      data.effective_fulfillment.primary_location.city
    ]
      .filter(Boolean)
      .join(", ");
  }, [data]);

  const outboundNeedsLocation = outboundMethod === "DELIVERY";
  const canReuseReturnLocation =
    outboundMethod === "DELIVERY" && returnMethod === "DELIVERY" && useSameLocationForReturn;
  const returnNeedsSeparateLocation = returnMethod === "DELIVERY" && !canReuseReturnLocation;
  const showReturnDeliveryToggle = outboundMethod === "DELIVERY" && returnMethod === "DELIVERY";

  function handleStartDateSelect(nextDate: Date | undefined) {
    setStartDate(nextDate);

    if (!nextDate) return;

    if (endDate && endDate < nextDate) {
      setEndDate(undefined);
    }

    setIsStartDateOpen(false);
    setShouldAutoOpenEndDate(true);
  }

  function handleEndDateSelect(nextDate: Date | undefined) {
    setEndDate(nextDate);
    if (!nextDate) return;
    setIsEndDateOpen(false);
  }

  function handleStartDateOpenChange(open: boolean) {
    setIsStartDateOpen(open);
    if (open) {
      setIsEndDateOpen(false);
      setShouldAutoOpenEndDate(false);
    }
  }

  function handleEndDateOpenChange(open: boolean) {
    setIsEndDateOpen(open);
    if (open) {
      setIsStartDateOpen(false);
    }
  }

  async function checkAvailability() {
    if (!startDate || !endDate) {
      toast.error("Choose dates to check availability.");
      return;
    }

    try {
      const response = await getAvailability(id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"));

      if (response.length === 0) {
        toast.success("Available! No overlapping reservations.");
      } else {
        toast.error("These dates overlap an existing reservation.");
      }
    } catch (nextError: unknown) {
      toast.error(nextError instanceof ApiError ? nextError.message : "Availability check failed");
    }
  }

  function buildLocationSelection(
    mode: "saved" | "new",
    selectedId: number | null,
    draft: SavedLocationInput
  ) {
    if (mode === "saved" && selectedId) {
      return { saved_location_id: selectedId };
    }
    if (mode === "new") {
      if (!locationComplete(draft)) {
        throw new Error("Complete the delivery location details before adding this reservation");
      }

      return {
        new_location: { ...draft, is_default: false },
        save_as_default: Boolean(draft.is_default)
      };
    }

    throw new Error("Choose or create a delivery location");
  }

  function buildFulfillmentPayload(): ReservationFulfillmentSelectionInput {
    if (!data) {
      throw new Error("Costume details are still loading");
    }

    return {
      outbound_method: outboundMethod,
      return_method: returnMethod,
      pickup_window_slot: outboundMethod === "PICKUP" ? pickupWindowSlot : null,
      delivery_window_slot: outboundMethod === "DELIVERY" ? deliveryWindowSlot : null,
      return_window_slot: returnWindowSlot,
      outbound_location:
        outboundMethod === "DELIVERY"
          ? buildLocationSelection(outboundLocationMode, selectedOutboundLocationId, newOutboundLocation)
          : null,
      return_location:
        returnMethod === "DELIVERY" && !canReuseReturnLocation
          ? buildLocationSelection(returnLocationMode, selectedReturnLocationId, newReturnLocation)
          : null,
      use_same_location_for_return: canReuseReturnLocation
    };
  }

  async function addToCart(openDrawer = false) {
    if (!user) {
      toast.error("Please log in to reserve.");
      return;
    }
    if (isOwnCostume) {
      toast.error("You cannot add your own costume to your cart.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please choose dates first.");
      return;
    }

    try {
      await addReservationToCart({
        costumeId: id,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        fulfillment: buildFulfillmentPayload()
      });
      triggerRefresh();
      toast.success(openDrawer ? "Added to cart." : "Costume added to cart.");
      if (openDrawer) {
        openCart();
      }
    } catch (nextError: unknown) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to add to cart");
    }
  }

  if (user?.role === "ADMIN") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <Skeleton className="h-[420px] w-full rounded-md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const packagePricingNote =
    data.costume.pricing_mode === "PACKAGE"
      ? `${fmtMoney(Number(data.costume.package_unused_day_discount))} off per unused day and ${fmtMoney(Number(data.costume.package_extra_day_charge))} per extra day`
      : null;

  const detailPills = [
    data.costume.category,
    data.costume.theme,
    data.costume.size ? `Size ${data.costume.size}` : null
  ].filter(Boolean) as string[];

  const descriptionLead =
    data.costume.description?.split(/\n+/).find((entry) => entry.trim().length > 0) ?? null;

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-6 pb-28 pt-14">
        <header className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Curated rental selection
          </p>

          <h1 className="animate-fade-up-delay-1 mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            {data.costume.name}
          </h1>

          <div className="animate-fade-up-delay-2 mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {detailPills.map((pill) => (
              <span
                key={pill}
                className="rounded-sm border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground"
              >
                {pill}
              </span>
            ))}
            <span>{data.avgRating ? `${data.avgRating.toFixed(1)} / 5` : "New"}</span>
            <span>/</span>
            <span>
              {data.ratingCount} review{data.ratingCount === 1 ? "" : "s"}
            </span>
            {isOwnCostume ? (
              <>
                <span>/</span>
                <span>Your listing</span>
              </>
            ) : null}
          </div>

          {descriptionLead ? (
            <p className="animate-fade-up-delay-3 mt-7 max-w-[620px] text-base leading-relaxed text-muted-foreground">
              {descriptionLead}
            </p>
          ) : null}
        </header>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="animate-fade-up space-y-6">
            <div className="rounded-md border border-border bg-card p-3">
              <div className="grid gap-4 lg:grid-cols-[84px_minmax(0,1fr)]">
                <div className="order-2 flex gap-3 overflow-x-auto pt-1 lg:order-1 lg:max-h-[720px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
                  {galleryImages.length > 0 ? (
                    galleryImages.map((image, index) => (
                      <button
                        key={`${image.src}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "group relative shrink-0 overflow-hidden rounded-sm border bg-muted transition-all duration-300",
                          "aspect-[3/4] w-20 lg:w-full",
                          index === selectedImageIndex
                            ? "border-foreground opacity-100"
                            : "border-border opacity-65 hover:opacity-100"
                        )}
                        aria-label={`View image ${index + 1}`}
                        aria-pressed={index === selectedImageIndex}
                      >
                        <img
                          src={image.src}
                          alt={`${image.alt} thumbnail ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="flex aspect-[3/4] w-20 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-muted/40 text-muted-foreground lg:w-full">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="order-1 space-y-4 lg:order-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-border bg-muted">
                    {selectedImage ? (
                      <img src={selectedImage.src} alt={selectedImage.alt} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                        <ImageIcon className="h-14 w-14" />
                      </div>
                    )}

                    {galleryImages.length > 0 ? (
                      <div className="pointer-events-none absolute right-4 top-4 rounded-sm border border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground backdrop-blur-sm">
                        {selectedImageIndex + 1} / {galleryImages.length}
                      </div>
                    ) : null}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-[linear-gradient(180deg,transparent,rgba(18,15,14,0.18))] px-4 pb-4 pt-16">
                      <div className="rounded-sm border border-white/30 bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
                        Image browser
                      </div>
                      {data.costume.category ? (
                        <div className="rounded-sm border border-white/30 bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
                          {data.costume.category}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <p>Product gallery</p>
                    <p>{galleryImages.length || 0} image{galleryImages.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card px-6 py-2">
              <Accordion type="multiple" defaultValue={["description", "details", "reviews"]}>
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>
                    {data.costume.description ? (
                      <p className="whitespace-pre-line leading-7 text-muted-foreground">{data.costume.description}</p>
                    ) : (
                      <p className="leading-7 text-muted-foreground">
                        No description has been added for this costume yet.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="details">
                  <AccordionTrigger>Rental details</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Category
                        </p>
                        <p className="mt-2 text-foreground">{data.costume.category || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Theme
                        </p>
                        <p className="mt-2 text-foreground">{data.costume.theme || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Size
                        </p>
                        <p className="mt-2 text-foreground">{data.costume.size || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Audience
                        </p>
                        <p className="mt-2 text-foreground">{data.costume.gender || "Flexible fit"}</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-sm border border-border bg-muted/20 px-4 py-4 text-sm leading-7 text-muted-foreground">
                      <p className="font-medium text-foreground">{pricingSummary?.label}</p>
                      <p className="mt-1">
                        {data.costume.pricing_mode === "PACKAGE"
                          ? packagePricingNote
                          : "Pricing is calculated by rental day."}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reviews">
                  <AccordionTrigger>Reviews ({reviews.length})</AccordionTrigger>
                  <AccordionContent>
                    {reviews.length > 0 ? (
                      <div className="space-y-5">
                        {reviews.map((review) => {
                          const reviewDate = formatReviewDate(review.created_at);

                          return (
                            <div key={review.id} className="rounded-sm border border-border bg-muted/20 px-4 py-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-foreground">{review.User?.name || "Guest"}</p>
                                  {reviewDate ? (
                                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                      {reviewDate}
                                    </p>
                                  ) : null}
                                </div>
                                <p className="text-sm font-medium text-foreground">{review.rating} / 5</p>
                              </div>
                              {review.comment ? (
                                <p className="mt-3 leading-7 text-muted-foreground">{review.comment}</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="leading-7 text-muted-foreground">
                        This costume does not have any reviews yet.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          <aside className="animate-fade-up-delay-1 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-md border border-border bg-card p-6">
              <div className="border-b border-border pb-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Reserve this look
                    </p>
                    <p className="mt-3 font-playfair text-4xl font-semibold tracking-tight text-foreground">
                      {fmtMoney(pricingSummary?.amount ?? 0)}
                    </p>
                  </div>
                  <p className="max-w-[8rem] text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {pricingSummary?.label}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {data.costume.pricing_mode === "PACKAGE"
                    ? `Includes ${data.costume.package_included_days} day${data.costume.package_included_days === 1 ? "" : "s"}. ${packagePricingNote}`
                    : "Choose your dates, fulfillment method, and handoff windows to generate a complete rental quote."}
                </p>
              </div>

              <div className="space-y-6 pt-6">
                <div className="grid gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <div className="flex items-center justify-between gap-4">
                    <span>Category</span>
                    <span className="text-right text-foreground">{data.costume.category || "Not specified"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Size</span>
                    <span className="text-right text-foreground">{data.costume.size || "Open fit"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Theme</span>
                    <span className="text-right text-foreground">{data.costume.theme || "General"}</span>
                  </div>
                </div>

                {isOwnCostume ? (
                  <Alert className="rounded-md border-border bg-transparent">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Your listing</AlertTitle>
                    <AlertDescription>You cannot add your own costume to your cart.</AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Start date</Label>
                    <Popover open={isStartDateOpen} onOpenChange={handleStartDateOpenChange}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-start px-3 text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "MMM d, yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">End date</Label>
                    <Popover open={isEndDateOpen} onOpenChange={handleEndDateOpenChange}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-start px-3 text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "MMM d, yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={handleEndDateSelect} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <section className="space-y-5 border-t border-border pt-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      Fulfillment plan
                    </p>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Choose how this reservation leaves the atelier, how it returns, and which time windows should frame each handoff.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-sm border border-border bg-muted/20 p-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Outbound method</Label>
                      <Select value={outboundMethod} onValueChange={(value: string) => setOutboundMethod(value as FulfillmentMethod)}>
                        <SelectTrigger className="h-11 w-full rounded-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methodOptionsForMode(data.effective_fulfillment.outbound_mode).map((method) => (
                            <SelectItem key={method} value={method}>
                              {FULFILLMENT_METHOD_LABELS[method]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Return method</Label>
                      <Select value={returnMethod} onValueChange={(value: string) => setReturnMethod(value as FulfillmentMethod)}>
                        <SelectTrigger className="h-11 w-full rounded-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methodOptionsForMode(data.effective_fulfillment.return_mode).map((method) => (
                            <SelectItem key={method} value={method}>
                              {FULFILLMENT_METHOD_LABELS[method]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {outboundMethod === "PICKUP" ? (
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Pickup window</Label>
                        <Select value={pickupWindowSlot} onValueChange={(value: string) => setPickupWindowSlot(value as FulfillmentWindowSlot)}>
                          <SelectTrigger className="h-11 w-full rounded-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WINDOW_OPTIONS.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {FULFILLMENT_WINDOW_LABELS[slot]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Delivery window</Label>
                        <Select value={deliveryWindowSlot} onValueChange={(value: string) => setDeliveryWindowSlot(value as FulfillmentWindowSlot)}>
                          <SelectTrigger className="h-11 w-full rounded-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WINDOW_OPTIONS.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {FULFILLMENT_WINDOW_LABELS[slot]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Return window</Label>
                      <Select value={returnWindowSlot} onValueChange={(value: string) => setReturnWindowSlot(value as FulfillmentWindowSlot)}>
                        <SelectTrigger className="h-11 w-full rounded-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WINDOW_OPTIONS.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {FULFILLMENT_WINDOW_LABELS[slot]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-sm border border-border bg-background px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Vendor handoff reference
                    </p>
                    <p className="mt-2 text-sm leading-7 text-foreground">
                      {vendorLocationLine || "Primary business location has not been configured yet."}
                    </p>
                    {data.effective_fulfillment.service_areas?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {data.effective_fulfillment.service_areas.map((area, index) => (
                          <span
                            key={`${area.label || area.area || area.city || index}`}
                            className="rounded-sm border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                          >
                            {area.label || area.area || area.city || "Service area"}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {outboundNeedsLocation ? (
                    <div className="space-y-4 rounded-sm border border-border bg-background px-4 py-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Outbound delivery location
                        </p>
                        <p className="text-sm leading-7 text-muted-foreground">
                          Delivery reservations require a saved location or a new address created for this booking.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant={outboundLocationMode === "saved" ? "default" : "outline"}
                          className="h-auto justify-start rounded-sm px-4 py-3 text-left"
                          onClick={() => setOutboundLocationMode("saved")}
                        >
                          Choose saved location
                        </Button>
                        <Button
                          type="button"
                          variant={outboundLocationMode === "new" ? "default" : "outline"}
                          className="h-auto justify-start rounded-sm px-4 py-3 text-left"
                          onClick={() => setOutboundLocationMode("new")}
                        >
                          Create new location
                        </Button>
                      </div>

                      {outboundLocationMode === "saved" && savedLocations.length > 0 ? (
                        <Select
                          value={selectedOutboundLocationId ? String(selectedOutboundLocationId) : undefined}
                          onValueChange={(value: string) => setSelectedOutboundLocationId(Number(value))}
                        >
                          <SelectTrigger className="h-11 w-full rounded-sm">
                            <SelectValue placeholder="Choose a saved location" />
                          </SelectTrigger>
                          <SelectContent>
                            {savedLocations.map((location) => (
                              <SelectItem key={location.id} value={String(location.id)}>
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      {outboundLocationMode === "saved" && savedLocations.length === 0 ? (
                        <div className="rounded-sm border border-dashed border-border px-4 py-4 text-sm leading-7 text-muted-foreground">
                          No saved locations yet. Switch to create a new location and this reservation can store it for later.
                        </div>
                      ) : null}

                      {outboundLocationMode === "new" ? (
                        <SavedLocationFields value={newOutboundLocation} onChange={setNewOutboundLocation} />
                      ) : null}
                    </div>
                  ) : null}

                  {showReturnDeliveryToggle ? (
                    <label className="flex items-center gap-3 rounded-sm border border-border bg-background px-4 py-4">
                      <input
                        type="checkbox"
                        checked={useSameLocationForReturn}
                        onChange={(event) => setUseSameLocationForReturn(event.target.checked)}
                        className="size-4 rounded border-border"
                      />
                      <span className="text-sm leading-7 text-foreground">
                        Use the same delivery location when the costume is picked up for return
                      </span>
                    </label>
                  ) : null}

                  {returnNeedsSeparateLocation ? (
                    <div className="space-y-4 rounded-sm border border-border bg-background px-4 py-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Return pickup location
                        </p>
                        <p className="text-sm leading-7 text-muted-foreground">
                          Choose where the vendor should retrieve the costume at the end of the rental.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant={returnLocationMode === "saved" ? "default" : "outline"}
                          className="h-auto justify-start rounded-sm px-4 py-3 text-left"
                          onClick={() => setReturnLocationMode("saved")}
                        >
                          Choose saved location
                        </Button>
                        <Button
                          type="button"
                          variant={returnLocationMode === "new" ? "default" : "outline"}
                          className="h-auto justify-start rounded-sm px-4 py-3 text-left"
                          onClick={() => setReturnLocationMode("new")}
                        >
                          Create new location
                        </Button>
                      </div>

                      {returnLocationMode === "saved" && savedLocations.length > 0 ? (
                        <Select
                          value={selectedReturnLocationId ? String(selectedReturnLocationId) : undefined}
                          onValueChange={(value: string) => setSelectedReturnLocationId(Number(value))}
                        >
                          <SelectTrigger className="h-11 w-full rounded-sm">
                            <SelectValue placeholder="Choose a saved location" />
                          </SelectTrigger>
                          <SelectContent>
                            {savedLocations.map((location) => (
                              <SelectItem key={location.id} value={String(location.id)}>
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      {returnLocationMode === "saved" && savedLocations.length === 0 ? (
                        <div className="rounded-sm border border-dashed border-border px-4 py-4 text-sm leading-7 text-muted-foreground">
                          No saved locations yet. Create one below to complete the return handoff plan.
                        </div>
                      ) : null}

                      {returnLocationMode === "new" ? (
                        <SavedLocationFields value={newReturnLocation} onChange={setNewReturnLocation} />
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="h-11 text-xs font-semibold uppercase tracking-widest"
                    onClick={checkAvailability}
                    disabled={isOwnCostume}
                  >
                    Check availability
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 text-xs font-semibold uppercase tracking-widest"
                    onClick={() => void addToCart(false)}
                    disabled={isOwnCostume}
                  >
                    Add to cart
                  </Button>
                  <Button
                    className="h-11 text-xs font-semibold uppercase tracking-widest"
                    onClick={() => void addToCart(true)}
                    disabled={isOwnCostume}
                  >
                    Reserve now
                  </Button>
                </div>

                {quote ? (
                  <div className="space-y-3 rounded-md border border-border bg-muted/20 px-4 py-4">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {quote.pricingMode === "PACKAGE"
                          ? `${fmtMoney(Number(data.costume.package_price))} package`
                          : `${fmtMoney(Number(data.costume.base_price_per_day))} x ${rentalDays} day${rentalDays === 1 ? "" : "s"}`}
                      </span>
                      <span className="font-semibold text-foreground">{fmtMoney(quote.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Fulfillment fees</span>
                      <span className="font-semibold text-foreground">{fmtMoney(fulfillmentFees)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-sm">
                      <span className="font-medium text-foreground">Reservation total</span>
                      <span className="font-playfair text-2xl font-semibold text-foreground">{fmtMoney(totalPreview)}</span>
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {rentalDays} day{rentalDays === 1 ? "" : "s"} selected
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
