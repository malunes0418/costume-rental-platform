import { Op, type WhereOptions } from "sequelize";
import { Dispute, type DisputeStatus } from "../models/Dispute";
import { DisputeMessage } from "../models/DisputeMessage";
import { Reservation } from "../models/Reservation";
import { User } from "../models/User";
import { getPagination } from "../utils/pagination";
import { adminAuditService } from "./AdminAuditService";

const DISPUTE_STATUSES: DisputeStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

function isDisputeStatus(value: string): value is DisputeStatus {
  return DISPUTE_STATUSES.includes(value as DisputeStatus);
}

const OPEN_STATUSES: DisputeStatus[] = ["OPEN", "IN_REVIEW"];

export type DisputeListQuery = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export class DisputeService {
  async list(query: DisputeListQuery = {}) {
    const where: WhereOptions = {};
    if (query.status && query.status !== "ALL") {
      if (!isDisputeStatus(query.status)) throw new Error("Invalid dispute status filter");
      Object.assign(where, { status: query.status });
    } else if (!query.status) {
      Object.assign(where, { status: { [Op.in]: OPEN_STATUSES } });
    }
    if (query.q) {
      Object.assign(where, {
        [Op.or]: [
          { subject: { [Op.like]: `%${query.q}%` } },
          { resolution_note: { [Op.like]: `%${query.q}%` } }
        ]
      });
    }

    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);
    const { rows, count } = await Dispute.findAndCountAll({
      where,
      include: [
        { model: User, as: "opener", attributes: ["id", "name", "email"], required: false },
        { model: User, as: "againstUser", attributes: ["id", "name", "email"], required: false },
        {
          model: Reservation,
          as: "reservation",
          attributes: ["id", "status", "total_price", "start_date", "end_date", "user_id"],
          required: false
        }
      ],
      offset,
      limit,
      order: [["created_at", "DESC"]],
      distinct: true
    });

    return { data: rows.map((r) => r.toJSON()), page, pageSize, total: count };
  }

  async getById(id: number) {
    const dispute = await Dispute.findByPk(id, {
      include: [
        { model: User, as: "opener", attributes: ["id", "name", "email"], required: false },
        { model: User, as: "againstUser", attributes: ["id", "name", "email"], required: false },
        {
          model: Reservation,
          as: "reservation",
          attributes: ["id", "status", "total_price", "start_date", "end_date", "user_id"],
          required: false
        },
        {
          model: DisputeMessage,
          as: "messages",
          include: [{ model: User, as: "author", attributes: ["id", "name", "email"], required: false }],
          separate: true,
          order: [["created_at", "ASC"]]
        }
      ]
    });
    if (!dispute) throw new Error("Dispute not found");
    return dispute.toJSON();
  }

  async create(
    input: {
      reservation_id: number;
      subject: string;
      against_user_id?: number | null;
      initial_message?: string;
    },
    actorId: number
  ) {
    if (!input.subject?.trim()) throw new Error("Subject is required");
    const reservation = await Reservation.findByPk(input.reservation_id);
    if (!reservation) throw new Error("Reservation not found");

    if (input.against_user_id) {
      const against = await User.findByPk(input.against_user_id);
      if (!against) throw new Error("Against user not found");
    }

    const dispute = await Dispute.create({
      reservation_id: input.reservation_id,
      opened_by: actorId,
      against_user_id: input.against_user_id || null,
      subject: input.subject.trim(),
      status: "OPEN"
    });

    if (input.initial_message?.trim()) {
      await DisputeMessage.create({
        dispute_id: dispute.id,
        author_id: actorId,
        body: input.initial_message.trim()
      });
    }

    await adminAuditService.record({
      actorId,
      action: "dispute.create",
      entityType: "dispute",
      entityId: dispute.id,
      after: {
        reservation_id: dispute.reservation_id,
        subject: dispute.subject,
        status: dispute.status,
        against_user_id: dispute.against_user_id
      }
    });

    return this.getById(dispute.id);
  }

  async updateStatus(
    id: number,
    status: string,
    actorId: number,
    resolutionNote?: string
  ) {
    if (!isDisputeStatus(status)) throw new Error("Invalid dispute status");
    const dispute = await Dispute.findByPk(id);
    if (!dispute) throw new Error("Dispute not found");

    const before = { status: dispute.status, resolution_note: dispute.resolution_note };
    dispute.status = status;
    if (resolutionNote !== undefined) {
      dispute.resolution_note = resolutionNote.trim() || null;
    }
    dispute.updated_at = new Date();
    await dispute.save();

    await adminAuditService.record({
      actorId,
      action: "dispute.status_update",
      entityType: "dispute",
      entityId: dispute.id,
      before,
      after: { status: dispute.status, resolution_note: dispute.resolution_note },
      reason: resolutionNote
    });

    return this.getById(dispute.id);
  }

  async addMessage(disputeId: number, body: string, actorId: number) {
    if (!body?.trim()) throw new Error("Message body is required");
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (dispute.status === "CLOSED") {
      throw new Error("Cannot add messages to a closed dispute");
    }

    const message = await DisputeMessage.create({
      dispute_id: disputeId,
      author_id: actorId,
      body: body.trim()
    });

    await adminAuditService.record({
      actorId,
      action: "dispute.message_add",
      entityType: "dispute",
      entityId: disputeId,
      after: { message_id: message.id },
      metadata: { body_preview: body.trim().slice(0, 120) }
    });

    return this.getById(disputeId);
  }

  async countOpen() {
    return Dispute.count({ where: { status: { [Op.in]: OPEN_STATUSES } } });
  }
}

export const disputeService = new DisputeService();
