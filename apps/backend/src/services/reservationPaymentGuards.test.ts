import { beforeEach, describe, expect, it, vi } from "vitest";
import { Payment } from "../models/Payment";
import {
  assertInitialPaymentApprovedForVendorReview,
  assertNoBlockingPaymentForRenterCancel
} from "./reservationPaymentGuards";

vi.mock("../models/Payment", () => ({
  Payment: {
    findAll: vi.fn()
  }
}));

describe("reservationPaymentGuards", () => {
  beforeEach(() => {
    vi.mocked(Payment.findAll).mockReset();
  });

  it("requires an approved initial payment before vendor review", async () => {
    vi.mocked(Payment.findAll).mockResolvedValue([
      { reservation_ids: [9], status: "APPROVED", payment_purpose: "INITIAL_RESERVATION" }
    ] as never);

    await expect(
      assertInitialPaymentApprovedForVendorReview({ id: 9, user_id: 1 } as never)
    ).resolves.toBeUndefined();
  });

  it("blocks renter cancel when a pending or approved payment exists", async () => {
    vi.mocked(Payment.findAll).mockResolvedValue([
      { reservation_ids: [4], status: "PENDING" }
    ] as never);

    await expect(
      assertNoBlockingPaymentForRenterCancel({ id: 4, user_id: 2 } as never)
    ).rejects.toThrow(/cannot be cancelled/i);
  });

  it("allows renter cancel when only rejected payments exist", async () => {
    vi.mocked(Payment.findAll).mockResolvedValue([
      { reservation_ids: [4], status: "REJECTED" }
    ] as never);

    await expect(
      assertNoBlockingPaymentForRenterCancel({ id: 4, user_id: 2 } as never)
    ).resolves.toBeUndefined();
  });
});
