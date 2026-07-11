import { Op, type WhereOptions } from "sequelize";
import { sequelize } from "../config/db";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { VendorPaymentMethod } from "../models/VendorPaymentMethod";
import {
  VendorEarningEntry,
  type VendorEarningEntryStatus
} from "../models/VendorEarningEntry";
import { VendorPayout, type VendorPayoutPaymentMethodSnapshot } from "../models/VendorPayout";
import { getPagination } from "../utils/pagination";
import { adminAuditService } from "./AdminAuditService";
import { platformSettingsService } from "./PlatformSettingsService";

const ELIGIBLE_STATUSES = ["COMPLETED"] as const;
const HOLDABLE: VendorEarningEntryStatus[] = ["AVAILABLE", "PENDING"];

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function grossFromReservation(reservation: {
  total_price: number | string;
  adjustments?: Array<{ status: string; amount: number | string }>;
}) {
  const surcharge = (reservation.adjustments || [])
    .filter((a) => a.status === "PAID")
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);
  return money(Number(reservation.total_price || 0) + surcharge);
}

export class PayoutService {
  async syncEligibleEntries(actorId?: number) {
    const feeRate = await platformSettingsService.getFeeRate();
    const reservations = await Reservation.findAll({
      where: { status: { [Op.in]: [...ELIGIBLE_STATUSES] } },
      include: [
        { model: ReservationItem, as: "items", include: [Costume] },
        { association: "adjustments" }
      ]
    });

    let created = 0;
    for (const reservation of reservations) {
      const existing = await VendorEarningEntry.findOne({
        where: { reservation_id: reservation.id }
      });
      if (existing) continue;

      const json = reservation.toJSON() as any;
      const items = json.items || [];
      const vendorIds = [
        ...new Set(
          items
            .map((item: any) => item.Costume?.owner_id)
            .filter((id: unknown): id is number => typeof id === "number" && id > 0)
        )
      ];
      if (vendorIds.length !== 1) continue;

      const vendorId = vendorIds[0] as number;
      const gross = grossFromReservation(json);
      const feeAmount = money(gross * feeRate);
      const netAmount = money(gross - feeAmount);

      await VendorEarningEntry.create({
        vendor_id: vendorId,
        reservation_id: reservation.id,
        gross_amount: gross,
        fee_rate: feeRate,
        fee_amount: feeAmount,
        net_amount: netAmount,
        status: "AVAILABLE"
      });
      created += 1;
    }

    if (actorId && created > 0) {
      await adminAuditService.record({
        actorId,
        action: "payout.sync_entries",
        entityType: "vendor_earning_entry",
        entityId: 0,
        after: { created },
        metadata: { fee_rate: feeRate }
      });
    }

    return { created, fee_rate: feeRate };
  }

  async listVendorBalances(query: { q?: string; page?: number; pageSize?: number } = {}) {
    await this.syncEligibleEntries();

    const vendorWhere: WhereOptions = { vendor_status: "APPROVED" };
    if (query.q) {
      Object.assign(vendorWhere, {
        [Op.or]: [
          { name: { [Op.like]: `%${query.q}%` } },
          { email: { [Op.like]: `%${query.q}%` } }
        ]
      });
    }

    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);
    const { rows, count } = await User.findAndCountAll({
      where: vendorWhere,
      include: [{ model: VendorProfile, attributes: ["business_name"], required: false }],
      offset,
      limit,
      order: [["id", "ASC"]]
    });

    const vendorIds = rows.map((u) => u.id);
    const entries = vendorIds.length
      ? await VendorEarningEntry.findAll({
          where: { vendor_id: { [Op.in]: vendorIds } },
          attributes: ["vendor_id", "status", "net_amount", "gross_amount", "fee_amount"]
        })
      : [];

    const byVendor = new Map<
      number,
      { available: number; held: number; pending_payout: number; paid: number; gross: number }
    >();
    for (const id of vendorIds) {
      byVendor.set(id, { available: 0, held: 0, pending_payout: 0, paid: 0, gross: 0 });
    }
    for (const entry of entries) {
      const bucket = byVendor.get(entry.vendor_id);
      if (!bucket) continue;
      const net = Number(entry.net_amount);
      const gross = Number(entry.gross_amount);
      bucket.gross += gross;
      if (entry.status === "AVAILABLE") bucket.available += net;
      else if (entry.status === "HELD") bucket.held += net;
      else if (entry.status === "INCLUDED_IN_PAYOUT") bucket.pending_payout += net;
      else if (entry.status === "PAID") bucket.paid += net;
    }

    const data = rows.map((user) => {
      const json = user.toJSON() as any;
      const bal = byVendor.get(user.id)!;
      return {
        vendor_id: user.id,
        name: json.name,
        email: json.email,
        business_name: json.VendorProfile?.business_name ?? null,
        available_balance: money(bal.available),
        held_balance: money(bal.held),
        pending_payout_balance: money(bal.pending_payout),
        paid_total: money(bal.paid),
        gross_total: money(bal.gross)
      };
    });

    return { data, page, pageSize, total: count };
  }

  async listPayouts(query: { vendorId?: number; status?: string; page?: number; pageSize?: number } = {}) {
    const where: WhereOptions = {};
    if (query.vendorId) Object.assign(where, { vendor_id: query.vendorId });
    if (query.status && query.status !== "ALL") Object.assign(where, { status: query.status });

    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);
    const { rows, count } = await VendorPayout.findAndCountAll({
      where,
      include: [
        { model: User, as: "vendor", attributes: ["id", "name", "email"], required: false },
        {
          model: VendorEarningEntry,
          as: "entries",
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

  async getVendorDetail(vendorId: number) {
    const user = await User.findByPk(vendorId, {
      include: [{ model: VendorProfile, required: false }]
    });
    if (!user || user.vendor_status === "NONE") throw new Error("Vendor not found");

    const [entries, payouts, paymentMethods] = await Promise.all([
      VendorEarningEntry.findAll({
        where: { vendor_id: vendorId },
        include: [
          {
            model: Reservation,
            as: "reservation",
            attributes: ["id", "status", "total_price", "start_date", "end_date"]
          }
        ],
        order: [["created_at", "DESC"]]
      }),
      VendorPayout.findAll({
        where: { vendor_id: vendorId },
        order: [["created_at", "DESC"]]
      }),
      VendorPaymentMethod.findAll({
        where: { user_id: vendorId, is_active: true },
        order: [
          ["sort_order", "ASC"],
          ["id", "ASC"]
        ]
      })
    ]);

    const balances = {
      available: 0,
      held: 0,
      pending_payout: 0,
      paid: 0
    };
    for (const entry of entries) {
      const net = Number(entry.net_amount);
      if (entry.status === "AVAILABLE") balances.available += net;
      else if (entry.status === "HELD") balances.held += net;
      else if (entry.status === "INCLUDED_IN_PAYOUT") balances.pending_payout += net;
      else if (entry.status === "PAID") balances.paid += net;
    }

    return {
      vendor: user.toJSON(),
      balances: {
        available_balance: money(balances.available),
        held_balance: money(balances.held),
        pending_payout_balance: money(balances.pending_payout),
        paid_total: money(balances.paid)
      },
      entries: entries.map((e) => e.toJSON()),
      payouts: payouts.map((p) => p.toJSON()),
      payment_methods: paymentMethods.map((m) => m.toJSON())
    };
  }

  async createPayout(
    input: { vendor_id: number; payment_method_id?: number; notes?: string; entry_ids?: number[] },
    actorId: number
  ) {
    await this.syncEligibleEntries(actorId);

    return sequelize.transaction(async (transaction) => {
      const vendor = await User.findByPk(input.vendor_id, { transaction });
      if (!vendor || vendor.vendor_status !== "APPROVED") {
        throw new Error("Approved vendor required");
      }

      const entryWhere: WhereOptions = {
        vendor_id: input.vendor_id,
        status: "AVAILABLE"
      };
      if (input.entry_ids?.length) {
        Object.assign(entryWhere, { id: { [Op.in]: input.entry_ids } });
      }

      const entries = await VendorEarningEntry.findAll({
        where: entryWhere,
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (entries.length === 0) {
        throw new Error("No available earning entries for payout");
      }

      let paymentMethod: VendorPaymentMethod | null = null;
      if (input.payment_method_id) {
        paymentMethod = await VendorPaymentMethod.findOne({
          where: { id: input.payment_method_id, user_id: input.vendor_id, is_active: true },
          transaction
        });
        if (!paymentMethod) throw new Error("Payment method not found");
      } else {
        paymentMethod = await VendorPaymentMethod.findOne({
          where: { user_id: input.vendor_id, is_active: true },
          order: [
            ["sort_order", "ASC"],
            ["id", "ASC"]
          ],
          transaction
        });
      }

      const snapshot: VendorPayoutPaymentMethodSnapshot | null = paymentMethod
        ? {
            id: paymentMethod.id,
            method_type: paymentMethod.method_type,
            label: paymentMethod.label,
            account_name: paymentMethod.account_name,
            account_number: paymentMethod.account_number,
            bank_name: paymentMethod.bank_name,
            qr_image_url: paymentMethod.qr_image_url,
            instructions: paymentMethod.instructions
          }
        : null;

      const amount = money(entries.reduce((sum, e) => sum + Number(e.net_amount), 0));
      const payout = await VendorPayout.create(
        {
          vendor_id: input.vendor_id,
          amount,
          currency: "PHP",
          status: "PENDING",
          payment_method_snapshot: snapshot,
          notes: input.notes?.trim() || null,
          created_by: actorId
        },
        { transaction }
      );

      for (const entry of entries) {
        entry.status = "INCLUDED_IN_PAYOUT";
        entry.payout_id = payout.id;
        entry.updated_at = new Date();
        await entry.save({ transaction });
      }

      await adminAuditService.record({
        actorId,
        action: "payout.create",
        entityType: "vendor_payout",
        entityId: payout.id,
        after: {
          vendor_id: payout.vendor_id,
          amount: payout.amount,
          status: payout.status,
          entry_ids: entries.map((e) => e.id),
          payment_method_snapshot: snapshot
        },
        reason: input.notes
      });

      return payout.toJSON();
    });
  }

  async markPayoutPaid(payoutId: number, actorId: number, notes?: string) {
    return sequelize.transaction(async (transaction) => {
      const payout = await VendorPayout.findByPk(payoutId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!payout) throw new Error("Payout not found");
      if (payout.status !== "PENDING") throw new Error("Only pending payouts can be marked paid");

      const before = { status: payout.status, paid_at: payout.paid_at };
      payout.status = "PAID";
      payout.paid_at = new Date();
      if (notes?.trim()) payout.notes = notes.trim();
      payout.updated_at = new Date();
      await payout.save({ transaction });

      await VendorEarningEntry.update(
        { status: "PAID", updated_at: new Date() },
        { where: { payout_id: payout.id }, transaction }
      );

      await adminAuditService.record({
        actorId,
        action: "payout.mark_paid",
        entityType: "vendor_payout",
        entityId: payout.id,
        before,
        after: { status: payout.status, paid_at: payout.paid_at },
        reason: notes
      });

      return payout.toJSON();
    });
  }

  async markPayoutFailed(payoutId: number, actorId: number, failureReason?: string) {
    return sequelize.transaction(async (transaction) => {
      const payout = await VendorPayout.findByPk(payoutId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!payout) throw new Error("Payout not found");
      if (payout.status !== "PENDING") throw new Error("Only pending payouts can be marked failed");

      const before = { status: payout.status, failure_reason: payout.failure_reason };
      payout.status = "FAILED";
      payout.failure_reason = failureReason?.trim() || null;
      payout.updated_at = new Date();
      await payout.save({ transaction });

      await VendorEarningEntry.update(
        { status: "AVAILABLE", payout_id: null, updated_at: new Date() },
        { where: { payout_id: payout.id }, transaction }
      );

      await adminAuditService.record({
        actorId,
        action: "payout.mark_failed",
        entityType: "vendor_payout",
        entityId: payout.id,
        before,
        after: { status: payout.status, failure_reason: payout.failure_reason },
        reason: failureReason
      });

      return payout.toJSON();
    });
  }

  async setEntryHold(entryId: number, hold: boolean, actorId: number, reason?: string) {
    const entry = await VendorEarningEntry.findByPk(entryId);
    if (!entry) throw new Error("Earning entry not found");

    const before = { status: entry.status };
    if (hold) {
      if (!HOLDABLE.includes(entry.status)) {
        throw new Error("Only available/pending entries can be held");
      }
      entry.status = "HELD";
    } else {
      if (entry.status !== "HELD") throw new Error("Entry is not held");
      entry.status = "AVAILABLE";
    }
    entry.updated_at = new Date();
    await entry.save();

    await adminAuditService.record({
      actorId,
      action: hold ? "payout.entry_hold" : "payout.entry_release",
      entityType: "vendor_earning_entry",
      entityId: entry.id,
      before,
      after: { status: entry.status },
      reason
    });

    return entry.toJSON();
  }

  async countPendingPayouts() {
    return VendorPayout.count({ where: { status: "PENDING" } });
  }
}

export const payoutService = new PayoutService();
