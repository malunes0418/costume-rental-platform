import { AdminAuditLog } from "../models/AdminAuditLog";

export type AdminAuditRecordInput = {
  actorId: number;
  action: string;
  entityType: string;
  entityId: number;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

function toJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value: value as unknown };
}

export class AdminAuditService {
  async record(input: AdminAuditRecordInput) {
    return AdminAuditLog.create({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      before_json: toJsonRecord(input.before),
      after_json: toJsonRecord(input.after),
      reason: input.reason?.trim() || null,
      metadata: toJsonRecord(input.metadata),
      created_at: new Date()
    });
  }
}

export const adminAuditService = new AdminAuditService();
