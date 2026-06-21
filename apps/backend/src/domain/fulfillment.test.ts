import { describe, expect, it } from "vitest";
import {
  buildWindowRange,
  isModeNarrowerOrEqual,
  locationMatchesServiceArea,
  modeAllowsMethod
} from "./fulfillment";

describe("fulfillment domain", () => {
  it("narrows fulfillment modes consistently", () => {
    expect(isModeNarrowerOrEqual("BOTH", "PICKUP")).toBe(true);
    expect(isModeNarrowerOrEqual("PICKUP", "DELIVERY")).toBe(false);
    expect(modeAllowsMethod("BOTH", "DELIVERY")).toBe(true);
    expect(modeAllowsMethod("PICKUP", "DELIVERY")).toBe(false);
  });

  it("matches service areas by city or area", () => {
    expect(
      locationMatchesServiceArea({ city: "Quezon City", area: null, province: null }, {
        city: "Quezon City"
      })
    ).toBe(true);

    expect(
      locationMatchesServiceArea({ city: "Manila", area: "Ermita", province: null }, {
        area: "Ermita"
      })
    ).toBe(true);

    expect(
      locationMatchesServiceArea({ city: "Cebu", area: null, province: null }, {
        city: "Manila"
      })
    ).toBe(false);
  });

  it("builds fulfillment windows for a date", () => {
    const afternoon = buildWindowRange("2026-06-12", "AFTERNOON");
    expect(afternoon.start.getHours()).toBe(13);
    expect(afternoon.end.getHours()).toBe(16);
  });
});
