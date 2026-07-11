import { Op, type WhereOptions } from "sequelize";
import { ContentReport, type ContentReportStatus, type ContentReportTargetType } from "../models/ContentReport";
import { Costume } from "../models/Costume";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { getPagination } from "../utils/pagination";
import { adminAuditService } from "./AdminAuditService";
import type { AdminService as AdminServiceType } from "./AdminService";

const TARGET_TYPES: ContentReportTargetType[] = ["COSTUME", "USER", "REVIEW", "OTHER"];
const RESOLVE_STATUSES: Array<"RESOLVED" | "DISMISSED"> = ["RESOLVED", "DISMISSED"];

function isTargetType(value: string): value is ContentReportTargetType {
  return TARGET_TYPES.includes(value as ContentReportTargetType);
}

function getAdminService(): AdminServiceType {
  // Lazy require avoids CJS circular dep with AdminService overview imports.
  const { AdminService } = require("./AdminService") as typeof import("./AdminService");
  return new AdminService();
}

export type ModerationQueueQuery = {
  tab?: "flagged" | "reports";
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export class ModerationService {
  async getQueue(query: ModerationQueueQuery = {}) {
    const tab = query.tab === "reports" ? "reports" : "flagged";
    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);

    if (tab === "flagged") {
      const inventory = await getAdminService().listInventory({
        q: query.q,
        status: "FLAGGED",
        page,
        pageSize
      });
      return { tab, ...inventory };
    }

    const where: WhereOptions = {};
    const status = (query.status || "OPEN").toUpperCase();
    if (status !== "ALL") {
      Object.assign(where, { status });
    }
    if (query.q) {
      Object.assign(where, {
        [Op.or]: [
          { reason: { [Op.like]: `%${query.q}%` } },
          { details: { [Op.like]: `%${query.q}%` } }
        ]
      });
    }

    const { rows, count } = await ContentReport.findAndCountAll({
      where,
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email"], required: false },
        { model: User, as: "resolver", attributes: ["id", "name", "email"], required: false }
      ],
      offset,
      limit,
      order: [["created_at", "DESC"]]
    });

    const data = await Promise.all(
      rows.map(async (report) => {
        const json = report.toJSON() as any;
        let target: Record<string, unknown> | null = null;
        if (report.target_type === "COSTUME") {
          const costume = await Costume.findByPk(report.target_id, {
            include: [
              {
                association: "owner",
                attributes: ["id", "name", "email"],
                include: [{ model: VendorProfile, attributes: ["business_name"], required: false }]
              }
            ]
          });
          if (costume) {
            const c = costume.toJSON() as any;
            target = {
              id: c.id,
              name: c.name,
              status: c.status,
              vendor: c.owner
                ? {
                    user_id: c.owner.id,
                    name: c.owner.name,
                    email: c.owner.email,
                    business_name: c.owner.VendorProfile?.business_name
                  }
                : null
            };
          }
        } else if (report.target_type === "USER") {
          const user = await User.findByPk(report.target_id, {
            attributes: ["id", "name", "email", "role", "vendor_status"]
          });
          target = user ? (user.toJSON() as unknown as Record<string, unknown>) : null;
        }
        return { ...json, target };
      })
    );

    return { tab, data, page, pageSize, total: count };
  }

  async createReport(
    input: {
      target_type: string;
      target_id: number;
      reason: string;
      details?: string;
      reporter_id?: number | null;
    },
    actorId: number
  ) {
    if (!isTargetType(input.target_type)) {
      throw new Error("Invalid report target type");
    }
    if (!input.reason?.trim()) {
      throw new Error("Reason is required");
    }
    if (!Number.isFinite(input.target_id) || input.target_id <= 0) {
      throw new Error("Valid target_id is required");
    }

    if (input.target_type === "COSTUME") {
      const costume = await Costume.findByPk(input.target_id);
      if (!costume) throw new Error("Costume not found");
    } else if (input.target_type === "USER") {
      const user = await User.findByPk(input.target_id);
      if (!user) throw new Error("User not found");
    }

    const report = await ContentReport.create({
      reporter_id: input.reporter_id ?? actorId,
      target_type: input.target_type,
      target_id: input.target_id,
      reason: input.reason.trim(),
      details: input.details?.trim() || null,
      status: "OPEN"
    });

    await adminAuditService.record({
      actorId,
      action: "moderation.report_create",
      entityType: "content_report",
      entityId: report.id,
      after: {
        target_type: report.target_type,
        target_id: report.target_id,
        reason: report.reason,
        status: report.status
      }
    });

    return report;
  }

  async resolveReport(
    reportId: number,
    status: "RESOLVED" | "DISMISSED",
    actorId: number,
    resolutionNote?: string,
    costumeStatus?: "ACTIVE" | "HIDDEN" | "FLAGGED" | "DRAFT"
  ) {
    if (!RESOLVE_STATUSES.includes(status)) {
      throw new Error("Invalid resolution status");
    }

    const report = await ContentReport.findByPk(reportId);
    if (!report) throw new Error("Report not found");
    if (report.status !== "OPEN") {
      throw new Error("Report is already closed");
    }

    const before = {
      status: report.status,
      resolution_note: report.resolution_note
    };

    report.status = status as ContentReportStatus;
    report.resolution_note = resolutionNote?.trim() || null;
    report.resolved_by = actorId;
    report.resolved_at = new Date();
    report.updated_at = new Date();
    await report.save();

    let costumeUpdate = null;
    if (costumeStatus && report.target_type === "COSTUME") {
      costumeUpdate = await getAdminService().updateCostumeStatus(
        report.target_id,
        costumeStatus,
        actorId,
        resolutionNote || `Resolved report #${report.id}`
      );
    }

    await adminAuditService.record({
      actorId,
      action: status === "RESOLVED" ? "moderation.report_resolve" : "moderation.report_dismiss",
      entityType: "content_report",
      entityId: report.id,
      before,
      after: {
        status: report.status,
        resolution_note: report.resolution_note,
        resolved_by: report.resolved_by,
        costume_status: costumeStatus || null
      },
      reason: resolutionNote
    });

    return { report, costume: costumeUpdate };
  }

  async countOpenReports() {
    return ContentReport.count({ where: { status: "OPEN" } });
  }
}

export const moderationService = new ModerationService();
