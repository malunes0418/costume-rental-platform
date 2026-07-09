import type { LocationSnapshot } from "../../domain/fulfillment";
import type { LalamoveQuotationPayload, LalamoveStop } from "./LalamoveClient";

/**
 * Builds a Lalamove quotation payload from two LocationSnapshot objects.
 * Returns null if either location is missing lat/lng coordinates.
 */
export function buildQuotationPayload(
  from: LocationSnapshot | null | undefined,
  to: LocationSnapshot | null | undefined,
  serviceType: string
): LalamoveQuotationPayload | null {
  if (
    !from?.latitude ||
    !from?.longitude ||
    !to?.latitude ||
    !to?.longitude
  ) {
    return null;
  }

  const fromStop: LalamoveStop = {
    coordinates: {
      lat: String(from.latitude),
      lng: String(from.longitude)
    },
    address: buildAddressString(from)
  };

  const toStop: LalamoveStop = {
    coordinates: {
      lat: String(to.latitude),
      lng: String(to.longitude)
    },
    address: buildAddressString(to)
  };

  return {
    serviceType,
    stops: [fromStop, toStop]
  };
}

function buildAddressString(loc: LocationSnapshot): string {
  return [
    loc.address_line_1,
    loc.address_line_2,
    loc.barangay,
    loc.city,
    loc.province,
    loc.country ?? "Philippines"
  ]
    .filter(Boolean)
    .join(", ");
}

/** Parses the total price from a Lalamove price breakdown string, returns 0 on failure. */
export function parseQuotedPrice(totalStr: string | undefined): number {
  if (!totalStr) return 0;
  const parsed = parseFloat(totalStr);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
