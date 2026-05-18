export type PricingMode = "PER_DAY" | "PACKAGE";

export interface CostumePricingConfigInput {
  pricing_mode?: PricingMode | null;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
}

export interface NormalizedCostumePricingConfig {
  pricing_mode: PricingMode;
  base_price_per_day: number | null;
  package_price: number | null;
  package_included_days: number | null;
  package_unused_day_discount: number | null;
  package_extra_day_charge: number | null;
}

export interface CalculatedReservationPrice {
  pricingMode: PricingMode;
  rentalDays: number;
  quantity: number;
  unitSubtotal: number;
  subtotal: number;
  pricePerDaySnapshot: number;
  packageBasePrice: number | null;
  packageIncludedDays: number | null;
  packageUnusedDayDiscount: number | null;
  packageExtraDayCharge: number | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toFiniteNumber(value: unknown): number | null {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function ensureNonNegativeNumber(value: unknown, field: string) {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
}

function ensurePositiveInteger(value: unknown, field: string) {
  const parsed = toFiniteNumber(value);
  if (parsed === null || !Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} must be a whole number greater than 0`);
  }
}

export function normalizeCostumePricingConfig(
  input: CostumePricingConfigInput
): NormalizedCostumePricingConfig {
  const pricingMode = input.pricing_mode ?? "PER_DAY";
  if (pricingMode !== "PER_DAY" && pricingMode !== "PACKAGE") {
    throw new Error("Pricing mode must be PER_DAY or PACKAGE");
  }

  if (pricingMode === "PER_DAY") {
    ensureNonNegativeNumber(input.base_price_per_day, "Base price per day");

    return {
      pricing_mode: "PER_DAY",
      base_price_per_day: Number(input.base_price_per_day),
      package_price: null,
      package_included_days: null,
      package_unused_day_discount: null,
      package_extra_day_charge: null
    };
  }

  ensureNonNegativeNumber(input.package_price, "Package price");
  ensurePositiveInteger(input.package_included_days, "Package included days");
  ensureNonNegativeNumber(input.package_unused_day_discount, "Unused-day discount");
  ensureNonNegativeNumber(input.package_extra_day_charge, "Extra-day charge");

  const packagePrice = Number(input.package_price);
  const includedDays = Number(input.package_included_days);
  const unusedDayDiscount = Number(input.package_unused_day_discount);
  const minimumUnitPrice = packagePrice - Math.max(includedDays - 1, 0) * unusedDayDiscount;

  if (minimumUnitPrice < 0) {
    throw new Error("Package pricing results in a negative price for shorter rentals");
  }

  return {
    pricing_mode: "PACKAGE",
    base_price_per_day: null,
    package_price: packagePrice,
    package_included_days: includedDays,
    package_unused_day_discount: unusedDayDiscount,
    package_extra_day_charge: Number(input.package_extra_day_charge)
  };
}

export function calculateReservationPrice(
  input: CostumePricingConfigInput,
  rentalDays: number,
  quantity: number
): CalculatedReservationPrice {
  ensurePositiveInteger(rentalDays, "Rental days");
  ensurePositiveInteger(quantity, "Quantity");

  const normalized = normalizeCostumePricingConfig(input);

  if (normalized.pricing_mode === "PER_DAY") {
    const pricePerDay = Number(normalized.base_price_per_day);
    const unitSubtotal = pricePerDay * rentalDays;

    return {
      pricingMode: "PER_DAY",
      rentalDays,
      quantity,
      unitSubtotal,
      subtotal: unitSubtotal * quantity,
      pricePerDaySnapshot: pricePerDay,
      packageBasePrice: null,
      packageIncludedDays: null,
      packageUnusedDayDiscount: null,
      packageExtraDayCharge: null
    };
  }

  const includedDays = Number(normalized.package_included_days);
  const packagePrice = Number(normalized.package_price);
  const unusedDayDiscount = Number(normalized.package_unused_day_discount);
  const extraDayCharge = Number(normalized.package_extra_day_charge);
  const unusedIncludedDays = Math.max(includedDays - rentalDays, 0);
  const extraDays = Math.max(rentalDays - includedDays, 0);
  const unitSubtotal = packagePrice - unusedIncludedDays * unusedDayDiscount + extraDays * extraDayCharge;

  return {
    pricingMode: "PACKAGE",
    rentalDays,
    quantity,
    unitSubtotal,
    subtotal: unitSubtotal * quantity,
    pricePerDaySnapshot: 0,
    packageBasePrice: packagePrice,
    packageIncludedDays: includedDays,
    packageUnusedDayDiscount: unusedDayDiscount,
    packageExtraDayCharge: extraDayCharge
  };
}
