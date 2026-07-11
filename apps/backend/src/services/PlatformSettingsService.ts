import { PlatformSetting } from "../models/PlatformSetting";
import { adminAuditService } from "./AdminAuditService";

export const DEFAULT_PLATFORM_FEE_RATE = 0.1;

export type PlatformFeatureFlags = {
  moderation_enabled: boolean;
  disputes_enabled: boolean;
  payouts_enabled: boolean;
};

export type PlatformSettingsView = {
  platform_fee_rate: number;
  feature_flags: PlatformFeatureFlags;
};

const DEFAULT_FLAGS: PlatformFeatureFlags = {
  moderation_enabled: true,
  disputes_enabled: true,
  payouts_enabled: true
};

function asNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asFlags(value: unknown): PlatformFeatureFlags {
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    moderation_enabled: obj.moderation_enabled !== false,
    disputes_enabled: obj.disputes_enabled !== false,
    payouts_enabled: obj.payouts_enabled !== false
  };
}

export class PlatformSettingsService {
  async getAll(): Promise<PlatformSettingsView> {
    const rows = await PlatformSetting.findAll();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      platform_fee_rate: asNumber(map.get("platform_fee_rate"), DEFAULT_PLATFORM_FEE_RATE),
      feature_flags: asFlags(map.get("feature_flags") ?? DEFAULT_FLAGS)
    };
  }

  async getFeeRate(): Promise<number> {
    const row = await PlatformSetting.findOne({ where: { key: "platform_fee_rate" } });
    if (!row) return DEFAULT_PLATFORM_FEE_RATE;
    const rate = asNumber(row.value, DEFAULT_PLATFORM_FEE_RATE);
    if (rate < 0 || rate > 1) return DEFAULT_PLATFORM_FEE_RATE;
    return rate;
  }

  async update(
    input: {
      platform_fee_rate?: number;
      feature_flags?: Partial<PlatformFeatureFlags>;
    },
    actorId: number
  ): Promise<PlatformSettingsView> {
    const before = await this.getAll();

    if (input.platform_fee_rate !== undefined) {
      const rate = Number(input.platform_fee_rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
        throw new Error("platform_fee_rate must be between 0 and 1");
      }
      await this.upsert("platform_fee_rate", rate, actorId);
    }

    if (input.feature_flags) {
      const nextFlags: PlatformFeatureFlags = {
        ...before.feature_flags,
        ...input.feature_flags
      };
      await this.upsert("feature_flags", nextFlags, actorId);
    }

    const after = await this.getAll();

    await adminAuditService.record({
      actorId,
      action: "settings.update",
      entityType: "platform_settings",
      entityId: 0,
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown>
    });

    return after;
  }

  private async upsert(key: string, value: unknown, actorId: number) {
    const existing = await PlatformSetting.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      existing.updated_by = actorId;
      existing.updated_at = new Date();
      await existing.save();
      return existing;
    }
    return PlatformSetting.create({
      key,
      value,
      updated_by: actorId
    });
  }
}

export const platformSettingsService = new PlatformSettingsService();
