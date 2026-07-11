import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/PlatformSetting", () => ({
  PlatformSetting: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn()
  }
}));

vi.mock("./AdminAuditService", () => ({
  adminAuditService: {
    record: vi.fn(async () => ({}))
  }
}));

import { PlatformSetting } from "../models/PlatformSetting";
import { PlatformSettingsService, DEFAULT_PLATFORM_FEE_RATE } from "./PlatformSettingsService";
import { adminAuditService } from "./AdminAuditService";

describe("PlatformSettingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default fee rate when unset", async () => {
    vi.mocked(PlatformSetting.findOne).mockResolvedValue(null as any);
    const service = new PlatformSettingsService();
    await expect(service.getFeeRate()).resolves.toBe(DEFAULT_PLATFORM_FEE_RATE);
  });

  it("rejects out-of-range fee rates", async () => {
    vi.mocked(PlatformSetting.findAll).mockResolvedValue([
      { key: "platform_fee_rate", value: 0.1 },
      { key: "feature_flags", value: {} }
    ] as any);

    const service = new PlatformSettingsService();
    await expect(service.update({ platform_fee_rate: 1.5 }, 1)).rejects.toThrow(
      /between 0 and 1/
    );
  });

  it("updates fee rate and audits", async () => {
    const existing = {
      key: "platform_fee_rate",
      value: 0.1,
      updated_by: null as number | null,
      updated_at: new Date(),
      save: vi.fn(async function (this: any) {
        return this;
      })
    };

    vi.mocked(PlatformSetting.findAll)
      .mockResolvedValueOnce([
        { key: "platform_fee_rate", value: 0.1 },
        { key: "feature_flags", value: { moderation_enabled: true, disputes_enabled: true, payouts_enabled: true } }
      ] as any)
      .mockResolvedValueOnce([
        { key: "platform_fee_rate", value: 0.15 },
        { key: "feature_flags", value: { moderation_enabled: true, disputes_enabled: true, payouts_enabled: true } }
      ] as any);

    vi.mocked(PlatformSetting.findOne).mockResolvedValue(existing as any);

    const service = new PlatformSettingsService();
    const result = await service.update({ platform_fee_rate: 0.15 }, 7);

    expect(existing.value).toBe(0.15);
    expect(existing.updated_by).toBe(7);
    expect(existing.save).toHaveBeenCalled();
    expect(adminAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 7,
        action: "settings.update",
        entityType: "platform_settings"
      })
    );
    expect(result.platform_fee_rate).toBe(0.15);
  });
});
