import { describe, expect, it } from "vitest";
import { assertPasswordPolicy, normalizeEmail } from "./passwordPolicy";
import { assertValidRentalRange } from "./rentalDates";

describe("passwordPolicy", () => {
  it("rejects short passwords", () => {
    expect(() => assertPasswordPolicy("short")).toThrow(/at least 8/);
  });

  it("accepts passwords of 8+ characters", () => {
    expect(() => assertPasswordPolicy("longenough")).not.toThrow();
  });

  it("normalizes email", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });
});

describe("rentalDates", () => {
  it("rejects inverted ranges", () => {
    expect(() =>
      assertValidRentalRange(new Date("2026-07-10"), new Date("2026-07-09"))
    ).toThrow(/on or after/);
  });

  it("accepts equal and forward ranges", () => {
    expect(() =>
      assertValidRentalRange(new Date("2026-07-10"), new Date("2026-07-10"))
    ).not.toThrow();
    expect(() =>
      assertValidRentalRange(new Date("2026-07-10"), new Date("2026-07-12"))
    ).not.toThrow();
  });
});
