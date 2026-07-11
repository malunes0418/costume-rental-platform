import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Dispute", () => ({
  Dispute: {
    findByPk: vi.fn(),
    create: vi.fn(),
    findAndCountAll: vi.fn(),
    count: vi.fn()
  }
}));

vi.mock("../models/DisputeMessage", () => ({
  DisputeMessage: {
    create: vi.fn()
  }
}));

vi.mock("../models/Reservation", () => ({
  Reservation: {
    findByPk: vi.fn()
  }
}));

vi.mock("../models/User", () => ({
  User: {
    findByPk: vi.fn()
  }
}));

vi.mock("./AdminAuditService", () => ({
  adminAuditService: {
    record: vi.fn(async () => ({}))
  }
}));

import { Dispute } from "../models/Dispute";
import { Reservation } from "../models/Reservation";
import { DisputeService } from "./DisputeService";
import { adminAuditService } from "./AdminAuditService";

describe("DisputeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a dispute for a valid reservation", async () => {
    vi.mocked(Reservation.findByPk).mockResolvedValue({ id: 5 } as any);
    vi.mocked(Dispute.create).mockResolvedValue({
      id: 1,
      reservation_id: 5,
      subject: "Damage claim",
      status: "OPEN",
      against_user_id: null
    } as any);
    vi.mocked(Dispute.findByPk).mockResolvedValue({
      toJSON: () => ({ id: 1, status: "OPEN", subject: "Damage claim", messages: [] })
    } as any);

    const service = new DisputeService();
    const result = await service.create({ reservation_id: 5, subject: "Damage claim" }, 9);

    expect(Dispute.create).toHaveBeenCalled();
    expect(adminAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "dispute.create", entityId: 1 })
    );
    expect(result).toMatchObject({ id: 1, status: "OPEN" });
  });

  it("blocks invalid status transitions input", async () => {
    vi.mocked(Dispute.findByPk).mockResolvedValue({
      id: 3,
      status: "OPEN",
      resolution_note: null,
      save: vi.fn()
    } as any);

    const service = new DisputeService();
    await expect(service.updateStatus(3, "NOPE", 1)).rejects.toThrow(/Invalid dispute status/);
  });
});
