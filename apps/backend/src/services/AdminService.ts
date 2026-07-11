import { Op, type Order, type WhereOptions } from "sequelize";
import {
  assertReservationTransition,
  deriveVendorReservationStatus,
  isPreWithRenterStatus,
  isReservationStatus
} from "../domain/reservationLifecycle";
import { presentFulfillmentHandoffProofs } from "../domain/handoffProofs";
import { assertInitialPaymentApprovedForVendorReview } from "./reservationPaymentGuards";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { Reservation } from "../models/Reservation";
import { getPagination } from "../utils/pagination";
import { adminAuditService } from "./AdminAuditService";
import type { AdminInventoryListQuery, AdminOverviewResponse } from "../dto/admin.dto";

type CostumeStatus = "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";

const COSTUME_STATUSES: CostumeStatus[] = ["DRAFT", "ACTIVE", "HIDDEN", "FLAGGED"];

function isCostumeStatus(value: string): value is CostumeStatus {
  return COSTUME_STATUSES.includes(value as CostumeStatus);
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function last7DayKeys() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return dayKey(d);
  });
}

export class AdminService {
  async getOverview(): Promise<AdminOverviewResponse> {
    // Lazy requires avoid CJS circular deps with Moderation/Dispute/Payout services.
    const { moderationService } = require("./ModerationService") as typeof import("./ModerationService");
    const { disputeService } = require("./DisputeService") as typeof import("./DisputeService");
    const { payoutService } = require("./PayoutService") as typeof import("./PayoutService");

    const [
      users,
      reservations,
      pendingVendors,
      flaggedCostumes,
      openReports,
      openDisputes,
      pendingPayouts
    ] = await Promise.all([
      User.count(),
      Reservation.findAll({
        attributes: ["id", "status", "total_price", "created_at", "start_date", "end_date"],
        order: [["created_at", "DESC"]]
      }),
      User.count({ where: { vendor_status: "PENDING" } }),
      Costume.count({ where: { status: "FLAGGED" } }),
      moderationService.countOpenReports(),
      disputeService.countOpen(),
      payoutService.countPendingPayouts()
    ]);

    const reservationRows = reservations.map((r) => r.toJSON());
    const keys = last7DayKeys();

    const reservationsLast7Days = keys.map(
      (key) => reservationRows.filter((r) => r.created_at && dayKey(new Date(r.created_at)) === key).length
    );

    const quotedValueLast7Days = keys.map((key) =>
      reservationRows
        .filter((r) => r.created_at && dayKey(new Date(r.created_at)) === key)
        .reduce((sum, r) => sum + Number(r.total_price || 0), 0)
    );

    const activeReservations = reservationRows.filter(
      (r) => !["CART", "CANCELLED", "COMPLETED", "REJECTED_BY_VENDOR"].includes(r.status)
    ).length;

    const statusBreakdown = reservationRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const recentActivity = reservationRows.slice(0, 8).map((r) => ({
      id: `res-${r.id}`,
      label: `Reservation #${r.id}`,
      sub: `${r.start_date} → ${r.end_date}`,
      amount: Number(r.total_price || 0),
      status: r.status,
      date: r.created_at ? new Date(r.created_at).toISOString() : undefined
    }));

    return {
      queues: {
        pendingVendors,
        flaggedCostumes,
        openReports,
        openDisputes,
        pendingPayouts
      },
      kpis: {
        activeReservations,
        totalReservations: reservationRows.length,
        totalUsers: users
      },
      series: {
        reservationsLast7Days,
        quotedValueLast7Days
      },
      statusBreakdown,
      recentActivity
    };
  }

  async listReservations() {
    const reservations = await Reservation.findAll({
      include: [
        { model: ReservationItem, as: "items", include: [Costume] },
        { association: "fulfillment" },
        { association: "adjustments" },
        User
      ],
      order: [["created_at", "DESC"]]
    });

    return reservations.map((reservation) => {
      const json = reservation.toJSON();
      return {
        ...json,
        fulfillment: presentFulfillmentHandoffProofs(reservation.id, json.fulfillment)
      };
    });
  }

  async updateReservationStatus(reservationId: number, status: string, actorId: number, reason?: string) {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (!isReservationStatus(status)) {
      throw new Error("Invalid reservation status");
    }

    if (status === "CANCELLED" && !isPreWithRenterStatus(reservation.status)) {
      throw new Error("Admin can only cancel reservations before the costume is with the renter");
    }

    if (reservation.status === "PENDING_PAYMENT" && status === "PENDING_VENDOR_REVIEW") {
      await assertInitialPaymentApprovedForVendorReview(reservation);
    }

    const before = {
      status: reservation.status,
      vendor_status: reservation.vendor_status
    };

    assertReservationTransition(reservation.status, status, "Reservation");
    reservation.status = status;
    reservation.vendor_status = deriveVendorReservationStatus(status, reservation.vendor_status);
    await reservation.save();

    await adminAuditService.record({
      actorId,
      action: "reservation.status_update",
      entityType: "reservation",
      entityId: reservation.id,
      before,
      after: {
        status: reservation.status,
        vendor_status: reservation.vendor_status
      },
      reason
    });

    return reservation;
  }

  async listInventory(query: AdminInventoryListQuery = {}) {
    const where: WhereOptions = {};
    if (query.q) {
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.like]: `%${query.q}%` } },
          { category: { [Op.like]: `%${query.q}%` } },
          { theme: { [Op.like]: `%${query.q}%` } }
        ]
      });
    }
    if (query.status) {
      if (!isCostumeStatus(query.status)) {
        throw new Error("Invalid costume status filter");
      }
      Object.assign(where, { status: query.status });
    }

    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);

    let order: Order = [["created_at", "DESC"]];
    if (query.sort === "name_asc") order = [["name", "ASC"]];
    else if (query.sort === "name_desc") order = [["name", "DESC"]];
    else if (query.sort === "stock_asc") order = [["stock", "ASC"]];
    else if (query.sort === "stock_desc") order = [["stock", "DESC"]];
    else if (query.sort === "status_asc") order = [["status", "ASC"]];
    else if (query.sort === "created_asc") order = [["created_at", "ASC"]];

    const { rows, count } = await Costume.findAndCountAll({
      where,
      include: [
        {
          association: "owner",
          attributes: ["id", "name", "email", "vendor_status"],
          required: false,
          include: [{ model: VendorProfile, attributes: ["id", "business_name"], required: false }]
        }
      ],
      offset,
      limit,
      order,
      distinct: true
    });

    const data = rows.map((costume) => {
      const json = costume.toJSON() as any;
      const owner = json.owner;
      const { owner: _owner, ...rest } = json;
      return {
        ...rest,
        vendor: owner
          ? {
              user_id: owner.id,
              name: owner.name ?? undefined,
              email: owner.email,
              vendor_status: owner.vendor_status,
              business_name: owner.VendorProfile?.business_name ?? undefined
            }
          : null
      };
    });

    return { data, page, pageSize, total: count };
  }

  async getInventoryItem(costumeId: number) {
    const costume = await Costume.findByPk(costumeId, {
      include: [
        {
          association: "owner",
          attributes: ["id", "name", "email", "vendor_status"],
          required: false,
          include: [{ model: VendorProfile, attributes: ["id", "business_name", "bio"], required: false }]
        }
      ]
    });
    if (!costume) throw new Error("Costume not found");

    const json = costume.toJSON() as any;
    const owner = json.owner;
    const { owner: _owner, ...rest } = json;
    return {
      ...rest,
      vendor: owner
        ? {
            user_id: owner.id,
            name: owner.name ?? undefined,
            email: owner.email,
            vendor_status: owner.vendor_status,
            business_name: owner.VendorProfile?.business_name ?? undefined,
            bio: owner.VendorProfile?.bio ?? undefined
          }
        : null
    };
  }

  async listUsers() {
    return User.findAll();
  }

  async updateUserRole(userId: number, role: string, actorId: number, reason?: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    const before = { role: user.role };
    user.role = role as typeof user.role;
    await user.save();

    await adminAuditService.record({
      actorId,
      action: "user.role_update",
      entityType: "user",
      entityId: user.id,
      before,
      after: { role: user.role },
      reason
    });

    return user;
  }

  // --- Vendor Moderation ---
  async listPendingVendors() {
    return User.findAll({
      where: { vendor_status: "PENDING" },
      include: [VendorProfile]
    });
  }

  async listAllVendors() {
    return VendorProfile.findAll({
      include: [User]
    });
  }

  async updateVendorStatus(
    userId: number,
    status: "APPROVED" | "REJECTED",
    actorId: number,
    reviewNote?: string
  ) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    const profile = await VendorProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw new Error("Vendor profile not found");

    const before = {
      vendor_status: user.vendor_status,
      review_note: profile.review_note
    };

    user.vendor_status = status;
    await user.save();
    profile.review_note = reviewNote || null;
    profile.reviewed_at = new Date();
    await profile.save();

    await adminAuditService.record({
      actorId,
      action: status === "APPROVED" ? "vendor.approve" : "vendor.reject",
      entityType: "vendor",
      entityId: userId,
      before,
      after: {
        vendor_status: user.vendor_status,
        review_note: profile.review_note,
        reviewed_at: profile.reviewed_at
      },
      reason: reviewNote
    });

    return user;
  }

  async updateCostumeStatus(
    costumeId: number,
    status: CostumeStatus,
    actorId: number,
    reason?: string
  ) {
    if (!isCostumeStatus(status)) {
      throw new Error("Invalid costume status");
    }
    const costume = await Costume.findByPk(costumeId);
    if (!costume) throw new Error("Costume not found");

    const before = { status: costume.status, is_active: costume.is_active };
    costume.status = status;
    costume.is_active = status === "ACTIVE" ? true : costume.is_active;
    await costume.save();

    await adminAuditService.record({
      actorId,
      action: "costume.status_update",
      entityType: "costume",
      entityId: costume.id,
      before,
      after: { status: costume.status, is_active: costume.is_active },
      reason
    });

    return costume;
  }

  async bulkUpdateCostumeStatus(
    ids: number[],
    status: CostumeStatus,
    actorId: number,
    reason?: string
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("At least one costume id is required");
    }
    if (!isCostumeStatus(status)) {
      throw new Error("Invalid costume status");
    }

    const uniqueIds = [...new Set(ids.map(Number).filter((id) => Number.isFinite(id) && id > 0))];
    if (uniqueIds.length === 0) {
      throw new Error("At least one valid costume id is required");
    }

    const costumes = await Costume.findAll({ where: { id: { [Op.in]: uniqueIds } } });
    if (costumes.length === 0) {
      throw new Error("No costumes found for the given ids");
    }

    const updated: Costume[] = [];
    for (const costume of costumes) {
      const before = { status: costume.status, is_active: costume.is_active };
      costume.status = status;
      costume.is_active = status === "ACTIVE" ? true : costume.is_active;
      await costume.save();

      await adminAuditService.record({
        actorId,
        action: "costume.bulk_status_update",
        entityType: "costume",
        entityId: costume.id,
        before,
        after: { status: costume.status, is_active: costume.is_active },
        reason,
        metadata: { bulk: true, requested_ids: uniqueIds }
      });

      updated.push(costume);
    }

    return { updated: updated.length, status, ids: updated.map((c) => c.id) };
  }
}
