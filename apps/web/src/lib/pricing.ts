export type PricingMode = "PER_DAY" | "PACKAGE";

export interface CostumePricingDetails {
  pricing_mode?: PricingMode | null;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
}

export interface ReservationItemPricingDetails {
  quantity?: number | null;
  price_per_day?: number | null;
  pricing_mode?: PricingMode | null;
  package_base_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
}

export interface CalculatedCostumePrice {
  pricingMode: PricingMode;
  rentalDays: number;
  quantity: number;
  unitSubtotal: number;
  subtotal: number;
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function countRentalDaysInclusive(
  start: string | Date | undefined,
  end: string | Date | undefined
) {
  if (!start || !end) return 0;
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;

  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
}

export function calculateCostumePrice(
  pricing: CostumePricingDetails,
  rentalDays: number,
  quantity = 1
): CalculatedCostumePrice {
  const pricingMode = pricing.pricing_mode === "PACKAGE" ? "PACKAGE" : "PER_DAY";
  const safeDays = Math.max(1, rentalDays);
  const safeQuantity = Math.max(1, quantity);

  if (pricingMode === "PER_DAY") {
    const basePricePerDay = toNumber(pricing.base_price_per_day);
    const unitSubtotal = basePricePerDay * safeDays;
    return {
      pricingMode,
      rentalDays: safeDays,
      quantity: safeQuantity,
      unitSubtotal,
      subtotal: unitSubtotal * safeQuantity
    };
  }

  const packagePrice = toNumber(pricing.package_price);
  const includedDays = Math.max(1, toNumber(pricing.package_included_days));
  const unusedDayDiscount = toNumber(pricing.package_unused_day_discount);
  const extraDayCharge = toNumber(pricing.package_extra_day_charge);
  const unusedIncludedDays = Math.max(includedDays - safeDays, 0);
  const extraDays = Math.max(safeDays - includedDays, 0);
  const unitSubtotal = packagePrice - unusedIncludedDays * unusedDayDiscount + extraDays * extraDayCharge;

  return {
    pricingMode,
    rentalDays: safeDays,
    quantity: safeQuantity,
    unitSubtotal,
    subtotal: unitSubtotal * safeQuantity
  };
}

export function getCostumePricingSummary(pricing: CostumePricingDetails) {
  if (pricing.pricing_mode === "PACKAGE") {
    const includedDays = Math.max(1, toNumber(pricing.package_included_days));
    return {
      amount: toNumber(pricing.package_price),
      label: `package / ${includedDays} day${includedDays === 1 ? "" : "s"}`,
      detail: `-${toNumber(pricing.package_unused_day_discount)} per unused day, +${toNumber(pricing.package_extra_day_charge)} per extra day`
    };
  }

  return {
    amount: toNumber(pricing.base_price_per_day),
    label: "per day",
    detail: null as string | null
  };
}

export function getReservationItemPricingSummary(item: ReservationItemPricingDetails) {
  if (item.pricing_mode === "PACKAGE") {
    const includedDays = Math.max(1, toNumber(item.package_included_days));
    return {
      amount: toNumber(item.package_base_price),
      label: `package / ${includedDays} day${includedDays === 1 ? "" : "s"}`,
      detail: `-${toNumber(item.package_unused_day_discount)} unused day, +${toNumber(item.package_extra_day_charge)} extra day`
    };
  }

  return {
    amount: toNumber(item.price_per_day),
    label: "per day",
    detail: null as string | null
  };
}
