import type { ReviewPaymentRequest, UploadPaymentProofRequest } from "../dto";
import type { PaymentAttributes } from "../models/Payment";
import { Op } from "sequelize";
import { sequelize } from "../config/db";
import { deriveVendorReservationStatus, assertReservationTransition } from "../domain/reservationLifecycle";
import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { ReservationAdjustment } from "../models/ReservationAdjustment";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { NotificationService } from "./NotificationService";
import { uploadPublicPath } from "../middleware/uploadMiddleware";

export class PaymentService {
  constructor(private notificationService: NotificationService) {}

  private presentPayment(payment: Payment): PaymentAttributes {
    return {
      ...payment.toJSON(),
      proof_url: payment.proof_url ? `/api/payments/${payment.id}/proof` : null
    };
  }

  private parseReservationIds(reservationIds: UploadPaymentProofRequest["reservationIds"]) {
    let parsedIds: number[] = [];
    try {
      if (typeof reservationIds === "string") {
        parsedIds = JSON.parse(reservationIds).map(Number);
      } else if (Array.isArray(reservationIds)) {
        parsedIds = reservationIds.map(Number);
      } else if (reservationIds !== undefined) {
        parsedIds = [Number(reservationIds)];
      }
    } catch {
      if (typeof reservationIds === "string") {
        parsedIds = reservationIds.split(",").map(Number);
      }
    }

    if (!parsedIds.length || parsedIds.some((value) => Number.isNaN(value))) {
      throw new Error("Invalid reservation IDs");
    }

    return parsedIds;
  }

  private amountsMatch(left: number, right: number) {
    return Math.abs(Number(left) - Number(right)) < 0.01;
  }

  private async loadReservationOwners(userId: number, reservationIds: number[]) {
    return Reservation.findAll({
      where: { id: reservationIds, user_id: userId },
      include: [
        {
          model: ReservationItem,
          as: "items",
          required: true,
          include: [
            {
              model: Costume,
              attributes: ["id", "name", "owner_id"],
              required: true
            }
          ]
        }
      ]
    });
  }

  private buildVendorMessages(reservations: Reservation[]) {
    const vendorMessages = new Map<number, string[]>();

    for (const reservation of reservations) {
      const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
      for (const item of items) {
        const vendorId = Number(item.Costume?.owner_id);
        if (!vendorId) continue;
        const entries = vendorMessages.get(vendorId) || [];
        entries.push(`#${reservation.id}`);
        vendorMessages.set(vendorId, entries);
      }
    }

    return vendorMessages;
  }

  async uploadProof(userId: number, body: UploadPaymentProofRequest, file: any) {
    if (!file) {
      throw new Error("Proof file is required");
    }
    const proofUrl = uploadPublicPath(file);
    const adjustmentId = body.reservationAdjustmentId ? Number(body.reservationAdjustmentId) : null;
    if (adjustmentId) {
      if (!Number.isFinite(adjustmentId)) {
        throw new Error("Invalid reservation adjustment ID");
      }

      const adjustment = await ReservationAdjustment.findByPk(adjustmentId);
      if (!adjustment) {
        throw new Error("Reservation adjustment not found");
      }

      const reservation = await Reservation.findOne({
        where: { id: adjustment.reservation_id, user_id: userId },
        include: [
          {
            model: ReservationItem,
            as: "items",
            required: true,
            include: [
              {
                model: Costume,
                attributes: ["id", "name", "owner_id"],
                required: true
              }
            ]
          }
        ]
      });
      if (!reservation) {
        throw new Error("Reservation not found");
      }
      if (reservation.status !== "AWAITING_SURCHARGE_PAYMENT") {
        throw new Error("Reservation is not awaiting surcharge payment");
      }
      if (adjustment.status !== "PENDING") {
        throw new Error("Reservation adjustment is no longer awaiting payment");
      }

      const existingPayment = await Payment.findOne({
        where: {
          reservation_adjustment_id: adjustment.id,
          status: { [Op.in]: ["PENDING", "APPROVED"] }
        }
      });
      if (existingPayment) {
        throw new Error("A surcharge payment proof has already been submitted for this adjustment");
      }

      const expectedAmount = Number(adjustment.amount);
      if (body.amount !== undefined && body.amount !== null && body.amount !== "" && !this.amountsMatch(Number(body.amount), expectedAmount)) {
        throw new Error("Submitted surcharge amount does not match the requested adjustment");
      }

      const payment = await Payment.create({
        reservation_ids: [reservation.id],
        user_id: userId,
        amount: expectedAmount,
        proof_url: proofUrl,
        status: "PENDING",
        payment_purpose: "RESERVATION_ADJUSTMENT",
        reservation_adjustment_id: adjustment.id
      });

      const vendorMessages = this.buildVendorMessages([reservation]);
      for (const [vendorId, reservationRefs] of vendorMessages.entries()) {
        const uniqueReservations = [...new Set(reservationRefs)];
        await this.notificationService.create(
          vendorId,
          "SURCHARGE_PAYMENT_PROOF_UPLOADED",
          "Supplemental payment proof submitted",
          `A renter uploaded surcharge payment proof for reservation${uniqueReservations.length === 1 ? "" : "s"} ${uniqueReservations.join(", ")}. Verify the receipt before continuing.`
        );
      }

      return this.presentPayment(payment);
    }

    const parsedIds = this.parseReservationIds(body.reservationIds);
    const reservations: Reservation[] = [];

    for (const resId of parsedIds) {
      const reservation = await Reservation.findOne({ where: { id: resId, user_id: userId } });
      if (!reservation) {
        throw new Error(`Reservation ${resId} not found`);
      }
      if (reservation.status !== "PENDING_PAYMENT") {
        throw new Error(`Reservation ${resId} not pending payment`);
      }
      reservations.push(reservation);
    }

    const existingPayments = await Payment.findAll({
      where: {
        user_id: userId,
        status: { [Op.in]: ["PENDING", "APPROVED"] }
      }
    });
    const alreadySubmitted = existingPayments.some((payment) =>
      Array.isArray(payment.reservation_ids) &&
      payment.reservation_ids.some((reservationId) => parsedIds.includes(Number(reservationId)))
    );
    if (alreadySubmitted) {
      throw new Error("Payment proof has already been submitted for one or more selected reservations");
    }

    const reservationOwners = await this.loadReservationOwners(userId, parsedIds);

    const vendorIds = new Set<number>();
    for (const reservation of reservationOwners) {
      const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
      for (const item of items) {
        const vendorId = Number(item.Costume?.owner_id);
        if (vendorId) vendorIds.add(vendorId);
      }
    }

    if (vendorIds.size > 1) {
      throw new Error("Reservations from different vendors must be paid separately");
    }

    const expectedAmount = reservations.reduce((sum, reservation) => sum + Number(reservation.total_price), 0);
    if (body.amount !== undefined && body.amount !== null && body.amount !== "" && !this.amountsMatch(Number(body.amount), expectedAmount)) {
      throw new Error("Submitted payment amount does not match the reservation total");
    }

    const payment = await Payment.create({
      reservation_ids: parsedIds,
      user_id: userId,
      amount: expectedAmount,
      proof_url: proofUrl,
      status: "PENDING",
      payment_purpose: "INITIAL_RESERVATION"
    });

    const vendorMessages = this.buildVendorMessages(reservationOwners);
    for (const [vendorId, reservationRefs] of vendorMessages.entries()) {
      const uniqueReservations = [...new Set(reservationRefs)];
      await this.notificationService.create(
        vendorId,
        "PAYMENT_PROOF_UPLOADED",
        "Payment proof submitted",
        `A renter uploaded payment proof for reservation${uniqueReservations.length === 1 ? "" : "s"} ${uniqueReservations.join(", ")}. Verify the receipt before reviewing the booking.`
      );
    }

    return this.presentPayment(payment);
  }

  async listForUser(userId: number) {
    const payments = await Payment.findAll({
      where: { user_id: userId },
      include: [{ association: "reservationAdjustment", required: false }],
      order: [["created_at", "DESC"]]
    });
    return payments.map((payment) => ({
      ...this.presentPayment(payment),
      reservationAdjustment: (payment as any).reservationAdjustment
    }));
  }

  async getProofFileForViewer(userId: number, paymentId: number) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment || !payment.proof_url) {
      throw new Error("Payment receipt not found");
    }

    if (Number(payment.user_id) === Number(userId)) {
      return payment.proof_url;
    }

    const reservationIds = payment.reservation_ids || [];
    const reservations = await Reservation.findAll({
      where: { id: reservationIds },
      include: [
        {
          model: ReservationItem,
          as: "items",
          required: true,
          include: [{ model: Costume, attributes: ["owner_id"], required: true }]
        }
      ]
    });
    const ownsEveryReservation =
      reservations.length === reservationIds.length &&
      reservations.every((reservation) => {
        const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
        return items.length > 0 && items.every((item) => Number(item.Costume?.owner_id) === Number(userId));
      });

    if (!ownsEveryReservation) {
      throw new Error("Payment receipt not found");
    }

    return payment.proof_url;
  }

  async vendorReview(vendorId: number, { paymentId, status, notes }: ReviewPaymentRequest) {
    const id = Number(paymentId);
    if (!Number.isFinite(id) || (status !== "APPROVED" && status !== "REJECTED")) {
      throw new Error("Invalid payment review request");
    }
    const ok = status === "APPROVED";

    return sequelize.transaction(async (transaction) => {
      const payment = await Payment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!payment) {
        throw new Error("Payment not found");
      }
      if (payment.status !== "PENDING") {
        throw new Error("Payment has already been reviewed");
      }
      if (!payment.proof_url) {
        throw new Error("Payment receipt is missing");
      }

      const reservationIds = payment.reservation_ids || [];
      if (!reservationIds.length) {
        throw new Error("No reservations found for this payment");
      }

      const reservations = await Reservation.findAll({
        where: { id: reservationIds },
        include: [
          {
            model: ReservationItem,
            as: "items",
            required: true,
            include: [
              {
                model: Costume,
                attributes: ["id", "owner_id"],
                required: true
              }
            ]
          }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (reservations.length !== reservationIds.length) {
        throw new Error("One or more reservations not found");
      }
      const ownsEveryReservation = reservations.every((reservation) => {
        const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
        return items.length > 0 && items.every((item) => Number(item.Costume?.owner_id) === Number(vendorId));
      });
      if (!ownsEveryReservation) {
        throw new Error("Payment not found or unauthorized");
      }

      const adjustment =
        payment.reservation_adjustment_id != null
          ? await ReservationAdjustment.findByPk(Number(payment.reservation_adjustment_id), {
              transaction,
              lock: transaction.LOCK.UPDATE
            })
          : null;

      if (!ok) {
        payment.status = "REJECTED";
        payment.notes = notes || "";
        await payment.save({ transaction });
        const message =
          payment.payment_purpose === "RESERVATION_ADJUSTMENT"
            ? "Your supplemental payment proof was rejected. Please upload a new receipt to continue this reservation."
            : "Your payment proof was rejected. Please upload a new receipt to continue your reservation.";
        await this.notificationService.create(payment.user_id, "PAYMENT_STATUS", "Payment reviewed", message);
        return { payment: this.presentPayment(payment), reservations };
      }

      if (payment.payment_purpose === "RESERVATION_ADJUSTMENT") {
        if (!adjustment) {
          throw new Error("Reservation adjustment not found");
        }
        if (adjustment.status !== "PENDING") {
          throw new Error("Reservation adjustment has already been settled");
        }
      }

      for (const res of reservations) {
        if (payment.payment_purpose === "INITIAL_RESERVATION") {
          if (res.status !== "PENDING_PAYMENT") {
            throw new Error(
              `Reservation #${res.id} is ${res.status} and cannot accept an initial payment approval`
            );
          }
          assertReservationTransition(res.status, "PENDING_VENDOR_REVIEW", "Reservation");
          res.status = "PENDING_VENDOR_REVIEW";
        } else if (payment.payment_purpose === "RESERVATION_ADJUSTMENT") {
          if (res.status !== "AWAITING_SURCHARGE_PAYMENT") {
            throw new Error(
              `Reservation #${res.id} is ${res.status} and cannot accept a surcharge payment approval`
            );
          }
          assertReservationTransition(res.status, "CONFIRMED", "Reservation");
          res.status = "CONFIRMED";
        } else {
          throw new Error("Unsupported payment purpose");
        }
        res.vendor_status = deriveVendorReservationStatus(res.status, res.vendor_status);
        await res.save({ transaction });
      }

      payment.status = "APPROVED";
      payment.notes = notes || "";
      await payment.save({ transaction });

      if (payment.payment_purpose === "RESERVATION_ADJUSTMENT" && adjustment) {
        adjustment.status = "PAID";
        await adjustment.save({ transaction });
      }

      for (const res of reservations) {
        if (payment.payment_purpose === "INITIAL_RESERVATION") {
          await this.notificationService.create(
            res.user_id,
            "PAYMENT_APPROVED",
            "Payment approved",
            `The vendor verified your initial payment for reservation #${res.id}. Your booking is now awaiting vendor review.`
          );
        } else {
          await this.notificationService.create(
            res.user_id,
            "SURCHARGE_PAYMENT_APPROVED",
            "Supplemental payment approved",
            `The vendor verified your supplemental payment for reservation #${res.id}. The reservation is now confirmed.`
          );
        }
      }

      await this.notificationService.create(
        payment.user_id,
        "PAYMENT_STATUS",
        "Payment reviewed",
        payment.payment_purpose === "RESERVATION_ADJUSTMENT"
          ? "The vendor verified your supplemental payment."
          : "The vendor verified your payment."
      );

      return { payment: this.presentPayment(payment), reservations };
    });
  }
}
