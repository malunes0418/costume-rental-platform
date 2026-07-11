import { describe, expect, it } from "vitest";
import {
  canTransitionReservationStatus,
  getAllowedReservationTransitions,
  isPreWithRenterStatus,
  type ReservationStatus
} from "./reservationLifecycle";

describe("reservationLifecycle", () => {
  it("allows the new operational handoff graph", () => {
    const path: ReservationStatus[] = [
      "CONFIRMED",
      "DELIVERY_SCHEDULED",
      "WITH_RENTER",
      "RETURN_PENDING",
      "RETURNED",
      "COMPLETED"
    ];

    for (let index = 0; index < path.length - 1; index += 1) {
      expect(canTransitionReservationStatus(path[index], path[index + 1])).toBe(true);
    }
  });

  it("exposes cancellation edges before the renter has the costume", () => {
    const cancellable: ReservationStatus[] = [
      "CART",
      "PENDING_PAYMENT",
      "PENDING_VENDOR_REVIEW",
      "AWAITING_SURCHARGE_PAYMENT",
      "CONFIRMED",
      "DELIVERY_SCHEDULED"
    ];

    for (const status of cancellable) {
      expect(getAllowedReservationTransitions(status)).toContain("CANCELLED");
    }

    expect(getAllowedReservationTransitions("WITH_RENTER")).not.toContain("CANCELLED");
  });

  it("marks pre-with-renter statuses for admin cancel policy", () => {
    expect(isPreWithRenterStatus("DELIVERY_SCHEDULED")).toBe(true);
    expect(isPreWithRenterStatus("WITH_RENTER")).toBe(false);
  });

  it("rejects same-status transitions to keep handoff actions idempotent", () => {
    expect(canTransitionReservationStatus("CONFIRMED", "CONFIRMED")).toBe(false);
    expect(canTransitionReservationStatus("DELIVERY_SCHEDULED", "DELIVERY_SCHEDULED")).toBe(false);
    expect(canTransitionReservationStatus("WITH_RENTER", "WITH_RENTER")).toBe(false);
  });
});
