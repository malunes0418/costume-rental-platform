import { Request, Response } from "express";
import { AdminService } from "../services/AdminService";
import { moderationService } from "../services/ModerationService";
import { adminAuditQueryService } from "../services/AdminAuditQueryService";
import { disputeService } from "../services/DisputeService";
import { payoutService } from "../services/PayoutService";
import { platformSettingsService } from "../services/PlatformSettingsService";
import {
  AdminListInventoryResponse,
  AdminListReservationsResponse,
  AdminListUsersResponse,
  AdminOverviewResponse,
  ApiResponse
} from "../dto";
import type {
  AdminAuditListQuery,
  AdminDisputeListQuery,
  AdminInventoryListQuery,
  AdminModerationQueueQuery,
  AdminPayoutListQuery
} from "../dto/admin.dto";

const adminService = new AdminService();

function str(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

function num(v: unknown) {
  return v !== undefined && v !== "" && v !== null ? Number(v) : undefined;
}

function inventoryQueryFromRequest(query: Request["query"]): AdminInventoryListQuery {
  return {
    q: str(query.q),
    status: str(query.status),
    sort: str(query.sort),
    page: num(query.page),
    pageSize: num(query.pageSize)
  };
}

function moderationQueryFromRequest(query: Request["query"]): AdminModerationQueueQuery {
  const tab = str(query.tab);
  return {
    tab: tab === "reports" ? "reports" : "flagged",
    status: str(query.status),
    q: str(query.q),
    page: num(query.page),
    pageSize: num(query.pageSize)
  };
}

function auditQueryFromRequest(query: Request["query"]): AdminAuditListQuery {
  return {
    q: str(query.q),
    action: str(query.action),
    entityType: str(query.entityType),
    entityId: num(query.entityId),
    actorId: num(query.actorId),
    page: num(query.page),
    pageSize: num(query.pageSize)
  };
}

function disputeQueryFromRequest(query: Request["query"]): AdminDisputeListQuery {
  return {
    status: str(query.status),
    q: str(query.q),
    page: num(query.page),
    pageSize: num(query.pageSize)
  };
}

function payoutQueryFromRequest(query: Request["query"]): AdminPayoutListQuery {
  return {
    vendorId: num(query.vendorId),
    status: str(query.status),
    page: num(query.page),
    pageSize: num(query.pageSize)
  };
}

export class AdminController {
  async getOverview(req: Request, res: Response) {
    try {
      const data = await adminService.getOverview();
      ApiResponse.ok(res, data as AdminOverviewResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listReservations(req: Request, res: Response) {
    try {
      const reservations = await adminService.listReservations();
      ApiResponse.ok(res, reservations as AdminListReservationsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateReservationStatus(req: Request, res: Response) {
    try {
      const result = await adminService.updateReservationStatus(
        Number(req.params.id),
        req.body.status,
        req.user!.id,
        req.body.reason
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listInventory(req: Request, res: Response) {
    try {
      const data = await adminService.listInventory(inventoryQueryFromRequest(req.query));
      ApiResponse.ok(res, data as AdminListInventoryResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getInventoryItem(req: Request, res: Response) {
    try {
      const data = await adminService.getInventoryItem(Number(req.params.id));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async bulkUpdateCostumeStatus(req: Request, res: Response) {
    try {
      const result = await adminService.bulkUpdateCostumeStatus(
        req.body.ids,
        req.body.status,
        req.user!.id,
        req.body.reason
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listUsers(req: Request, res: Response) {
    try {
      const users = await adminService.listUsers();
      ApiResponse.ok(res, users as AdminListUsersResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const result = await adminService.updateUserRole(
        Number(req.params.id),
        req.body.role,
        req.user!.id,
        req.body.reason
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listPendingVendors(req: Request, res: Response) {
    try {
      const users = await adminService.listPendingVendors();
      const mapped = users.map((u: any) => ({
        id: u.VendorProfile?.id || u.id,
        user_id: u.id,
        business_name: u.VendorProfile?.business_name,
        store_name: u.VendorProfile?.business_name,
        bio: u.VendorProfile?.bio,
        id_document_url: u.VendorProfile?.id_document_url,
        review_note: u.VendorProfile?.review_note,
        reviewed_at: u.VendorProfile?.reviewed_at,
        status: u.vendor_status,
        created_at: u.VendorProfile?.created_at || u.created_at,
        User: {
          name: u.name,
          email: u.email
        }
      }));
      ApiResponse.ok(res, mapped);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listAllVendors(req: Request, res: Response) {
    try {
      const profiles = await adminService.listAllVendors();
      const mapped = profiles.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        business_name: p.business_name,
        store_name: p.business_name,
        bio: p.bio,
        id_document_url: p.id_document_url,
        review_note: p.review_note,
        reviewed_at: p.reviewed_at,
        status: p.User?.vendor_status || "NONE",
        created_at: p.created_at,
        User: {
          name: p.User?.name,
          email: p.User?.email
        }
      }));
      ApiResponse.ok(res, mapped);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async approveVendor(req: Request, res: Response) {
    try {
      const result = await adminService.updateVendorStatus(
        Number(req.params.userId),
        "APPROVED",
        req.user!.id,
        req.body.review_note
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async rejectVendor(req: Request, res: Response) {
    try {
      const result = await adminService.updateVendorStatus(
        Number(req.params.userId),
        "REJECTED",
        req.user!.id,
        req.body.review_note
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateCostumeStatus(req: Request, res: Response) {
    try {
      const result = await adminService.updateCostumeStatus(
        Number(req.params.id),
        req.body.status,
        req.user!.id,
        req.body.reason
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  // ── Moderation ─────────────────────────────────────────────────────────────

  async getModerationQueue(req: Request, res: Response) {
    try {
      const data = await moderationService.getQueue(moderationQueryFromRequest(req.query));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createContentReport(req: Request, res: Response) {
    try {
      const result = await moderationService.createReport(
        {
          target_type: req.body.target_type,
          target_id: Number(req.body.target_id),
          reason: req.body.reason,
          details: req.body.details,
          reporter_id: req.body.reporter_id != null ? Number(req.body.reporter_id) : req.user!.id
        },
        req.user!.id
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async resolveContentReport(req: Request, res: Response) {
    try {
      const result = await moderationService.resolveReport(
        Number(req.params.id),
        req.body.status,
        req.user!.id,
        req.body.resolution_note,
        req.body.costume_status
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  // ── Audit ──────────────────────────────────────────────────────────────────

  async listAuditLogs(req: Request, res: Response) {
    try {
      const data = await adminAuditQueryService.list(auditQueryFromRequest(req.query));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getAuditLog(req: Request, res: Response) {
    try {
      const data = await adminAuditQueryService.getById(Number(req.params.id));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  // ── Disputes ───────────────────────────────────────────────────────────────

  async listDisputes(req: Request, res: Response) {
    try {
      const data = await disputeService.list(disputeQueryFromRequest(req.query));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getDispute(req: Request, res: Response) {
    try {
      const data = await disputeService.getById(Number(req.params.id));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createDispute(req: Request, res: Response) {
    try {
      const data = await disputeService.create(
        {
          reservation_id: Number(req.body.reservation_id),
          subject: req.body.subject,
          against_user_id: req.body.against_user_id != null ? Number(req.body.against_user_id) : null,
          initial_message: req.body.initial_message
        },
        req.user!.id
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateDisputeStatus(req: Request, res: Response) {
    try {
      const data = await disputeService.updateStatus(
        Number(req.params.id),
        req.body.status,
        req.user!.id,
        req.body.resolution_note
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async addDisputeMessage(req: Request, res: Response) {
    try {
      const data = await disputeService.addMessage(
        Number(req.params.id),
        req.body.body,
        req.user!.id
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  // ── Payouts ────────────────────────────────────────────────────────────────

  async listVendorBalances(req: Request, res: Response) {
    try {
      const data = await payoutService.listVendorBalances({
        q: str(req.query.q),
        page: num(req.query.page),
        pageSize: num(req.query.pageSize)
      });
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getVendorPayoutDetail(req: Request, res: Response) {
    try {
      const data = await payoutService.getVendorDetail(Number(req.params.vendorId));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listPayouts(req: Request, res: Response) {
    try {
      const data = await payoutService.listPayouts(payoutQueryFromRequest(req.query));
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async syncEarningEntries(req: Request, res: Response) {
    try {
      const data = await payoutService.syncEligibleEntries(req.user!.id);
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createPayout(req: Request, res: Response) {
    try {
      const data = await payoutService.createPayout(
        {
          vendor_id: Number(req.body.vendor_id),
          payment_method_id:
            req.body.payment_method_id != null ? Number(req.body.payment_method_id) : undefined,
          notes: req.body.notes,
          entry_ids: Array.isArray(req.body.entry_ids)
            ? req.body.entry_ids.map(Number)
            : undefined
        },
        req.user!.id
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async markPayoutPaid(req: Request, res: Response) {
    try {
      const data = await payoutService.markPayoutPaid(
        Number(req.params.id),
        req.user!.id,
        req.body.notes
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async markPayoutFailed(req: Request, res: Response) {
    try {
      const data = await payoutService.markPayoutFailed(
        Number(req.params.id),
        req.user!.id,
        req.body.failure_reason
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async holdEarningEntry(req: Request, res: Response) {
    try {
      const data = await payoutService.setEntryHold(
        Number(req.params.id),
        true,
        req.user!.id,
        req.body.reason
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async releaseEarningEntry(req: Request, res: Response) {
    try {
      const data = await payoutService.setEntryHold(
        Number(req.params.id),
        false,
        req.user!.id,
        req.body.reason
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(req: Request, res: Response) {
    try {
      const data = await platformSettingsService.getAll();
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const data = await platformSettingsService.update(
        {
          platform_fee_rate: req.body.platform_fee_rate,
          feature_flags: req.body.feature_flags
        },
        req.user!.id
      );
      ApiResponse.ok(res, data);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
