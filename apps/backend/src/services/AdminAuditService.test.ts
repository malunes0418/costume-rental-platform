import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/AdminAuditLog", () => ({
  AdminAuditLog: {
    create: vi.fn(async (payload: Record<string, unknown>) => ({ id: 1, ...payload }))
  }
}));

import { AdminAuditLog } from "../models/AdminAuditLog";
import { AdminAuditService } from "./AdminAuditService";

describe("AdminAuditService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records an append-only audit entry", async () => {
    const service = new AdminAuditService();
    const row = await service.record({
      actorId: 9,
      action: "costume.status_update",
      entityType: "costume",
      entityId: 42,
      before: { status: "ACTIVE" },
      after: { status: "FLAGGED" },
      reason: "Policy review"
    });

    expect(AdminAuditLog.create).toHaveBeenCalledTimes(1);
    expect(row).toMatchObject({
      actor_id: 9,
      action: "costume.status_update",
      entity_type: "costume",
      entity_id: 42,
      reason: "Policy review"
    });
  });

  it("trims empty reasons to null", async () => {
    const service = new AdminAuditService();
    await service.record({
      actorId: 1,
      action: "user.role_update",
      entityType: "user",
      entityId: 3,
      reason: "   "
    });

    expect(AdminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: null })
    );
  });
});
