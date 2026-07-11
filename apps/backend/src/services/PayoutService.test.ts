import { describe, expect, it, vi, beforeEach } from "vitest";

const { findByPk } = vi.hoisted(() => ({
  findByPk: vi.fn()
}));

vi.mock("../config/db", () => ({
  sequelize: {
    transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => fn({ LOCK: { UPDATE: "UPDATE" } }))
  }
}));

vi.mock("./PlatformSettingsService", () => ({
  platformSettingsService: {
    getFeeRate: vi.fn(async () => 0.1)
  }
}));

vi.mock("./AdminAuditService", () => ({
  adminAuditService: {
    record: vi.fn(async () => ({}))
  }
}));

vi.mock("../models/Reservation", () => ({
  Reservation: { findAll: vi.fn(async () => []) }
}));

vi.mock("../models/ReservationItem", () => ({
  ReservationItem: {}
}));

vi.mock("../models/Costume", () => ({
  Costume: {}
}));

vi.mock("../models/User", () => ({
  User: { findByPk: vi.fn() }
}));

vi.mock("../models/VendorProfile", () => ({
  VendorProfile: {}
}));

vi.mock("../models/VendorPaymentMethod", () => ({
  VendorPaymentMethod: { findOne: vi.fn(), findAll: vi.fn() }
}));

vi.mock("../models/VendorEarningEntry", () => ({
  VendorEarningEntry: {
    findByPk,
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock("../models/VendorPayout", () => ({
  VendorPayout: {
    create: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
    count: vi.fn()
  }
}));

import { PayoutService } from "./PayoutService";
import { adminAuditService } from "./AdminAuditService";

describe("PayoutService fee math helpers via sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("holds and releases available entries", async () => {
    const entry = {
      id: 11,
      status: "AVAILABLE",
      updated_at: new Date(),
      save: vi.fn(async function (this: any) {
        return this;
      }),
      toJSON() {
        return { id: this.id, status: this.status };
      }
    };

    findByPk.mockResolvedValue(entry);

    const service = new PayoutService();
    const held = await service.setEntryHold(11, true, 1, "fraud check");
    expect(held.status).toBe("HELD");
    expect(adminAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "payout.entry_hold" })
    );

    entry.status = "HELD";
    const released = await service.setEntryHold(11, false, 1);
    expect(released.status).toBe("AVAILABLE");
  });

  it("rejects hold on non-available entries", async () => {
    findByPk.mockResolvedValue({
      id: 2,
      status: "PAID",
      save: vi.fn()
    });

    const service = new PayoutService();
    await expect(service.setEntryHold(2, true, 1)).rejects.toThrow(/available\/pending/);
  });
});
