import type { AdminReviewPaymentRequest, UploadPaymentProofRequest } from "../dto";
import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { NotificationService } from "./NotificationService";
import { User } from "../models/User";

export class PaymentService {
  constructor(private notificationService: NotificationService) {}

  async uploadProof(userId: number, body: UploadPaymentProofRequest, file: any) {
    if (!file) {
      throw new Error("Proof file is required");
    }
    const { reservationIds, amount } = body;
    let parsedIds: number[] = [];
    try {
      if (typeof reservationIds === 'string') {
        parsedIds = JSON.parse(reservationIds).map(Number);
      } else if (Array.isArray(reservationIds)) {
        parsedIds = reservationIds.map(Number);
      } else {
        parsedIds = [Number(reservationIds)];
      }
    } catch {
      if (typeof reservationIds === 'string') {
        parsedIds = reservationIds.split(',').map(Number);
      } else {
        parsedIds = [];
      }
    }

    if (!parsedIds || parsedIds.length === 0 || parsedIds.some(isNaN)) {
      throw new Error("Invalid reservation IDs");
    }

    // Verify all reservations
    for (const resId of parsedIds) {
      const reservation = await Reservation.findOne({ where: { id: resId, user_id: userId } });
      if (!reservation) {
        throw new Error(`Reservation ${resId} not found`);
      }
      if (reservation.status !== "PENDING_PAYMENT") {
        throw new Error(`Reservation ${resId} not pending payment`);
      }
    }

    const proofUrl = `/uploads/${file.filename}`;
    const payment = await Payment.create({
      reservation_ids: parsedIds,
      user_id: userId,
      amount: Number(amount),
      proof_url: proofUrl,
      status: "PENDING"
    });
    
    const user = await User.findByPk(userId);
    if (user) {
      await this.notificationService.createForAdmin("PAYMENT_PROOF_UPLOADED", "Payment proof uploaded", `User ${user.email} uploaded a payment proof for reservations: ${parsedIds.join(", ")}`);
    }
    return payment;
  }

  async listForUser(userId: number) {
    return Payment.findAll({ where: { user_id: userId } });
  }

  async adminReview({ paymentId, approve, notes }: AdminReviewPaymentRequest) {
    const id = Number(paymentId);
    const ok = typeof approve === "boolean" ? approve : Boolean(approve);
    const payment = await Payment.findByPk(id);
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    // Instead of single reservation_id, we now have reservation_ids
    const reservationIds = payment.reservation_ids || [];
    if (!reservationIds.length) {
      throw new Error("No reservations found for this payment");
    }

    // Verify all reservations exist
    const reservations = await Reservation.findAll({ where: { id: reservationIds } });
    if (reservations.length !== reservationIds.length) {
      throw new Error("One or more reservations not found");
    }

    payment.status = ok ? "APPROVED" : "REJECTED";
    payment.notes = notes || "";
    await payment.save();

    if (ok) {
      for (const res of reservations) {
        res.status = "PAID";
        await res.save();
      }
    }
    
    await this.notificationService.create(payment.user_id, "PAYMENT_STATUS", "Payment reviewed", ok ? "Your payment has been approved" : "Your payment has been rejected");
    return { payment, reservations };
  }
}
