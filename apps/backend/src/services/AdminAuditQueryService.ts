import { Op, type WhereOptions } from "sequelize";
import { AdminAuditLog } from "../models/AdminAuditLog";
import { User } from "../models/User";
import { getPagination } from "../utils/pagination";

export type AuditListQuery = {
  q?: string;
  action?: string;
  entityType?: string;
  entityId?: number;
  actorId?: number;
  page?: number;
  pageSize?: number;
};

export class AdminAuditQueryService {
  async list(query: AuditListQuery = {}) {
    const where: WhereOptions = {};
    if (query.action) Object.assign(where, { action: query.action });
    if (query.entityType) Object.assign(where, { entity_type: query.entityType });
    if (query.entityId) Object.assign(where, { entity_id: query.entityId });
    if (query.actorId) Object.assign(where, { actor_id: query.actorId });
    if (query.q) {
      Object.assign(where, {
        [Op.or]: [
          { action: { [Op.like]: `%${query.q}%` } },
          { entity_type: { [Op.like]: `%${query.q}%` } },
          { reason: { [Op.like]: `%${query.q}%` } }
        ]
      });
    }

    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);
    const { rows, count } = await AdminAuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: "actor", attributes: ["id", "name", "email"], required: false }],
      offset,
      limit,
      order: [["created_at", "DESC"]]
    });

    return {
      data: rows.map((row) => row.toJSON()),
      page,
      pageSize,
      total: count
    };
  }

  async getById(id: number) {
    const row = await AdminAuditLog.findByPk(id, {
      include: [{ model: User, as: "actor", attributes: ["id", "name", "email"], required: false }]
    });
    if (!row) throw new Error("Audit log not found");
    return row.toJSON();
  }
}

export const adminAuditQueryService = new AdminAuditQueryService();
