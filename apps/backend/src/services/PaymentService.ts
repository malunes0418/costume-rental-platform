import type { AdminReviewPaymentRequest, UploadPaymentProofRequest } from "../dto";
import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { NotificationService } from "./NotificationService";
import { User } from "../models/User";

export class PaymentService {
  constructor(private notificationService: NotificationService) {}

  async uploadProof(userId: number, body: UploadPaymentProofRequest, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new Error("Proof file is required");
    }
    const { reservationId, amount } = body;
    const reservation = await Reservation.findOne({ where: { id: Number(reservationId), user_id: userId } });
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    if (reservation.status !== "PENDING_PAYMENT") {
      throw new Error("Reservation not pending payment");
    }
    const proofUrl = `/uploads/${file.filename}`;
    const payment = await Payment.create({
      reservation_id: reservation.id,
      user_id: userId,
      amount: Number(amount),
      proof_url: proofUrl,
      status: "PENDING"
    });
    const user = await User.findByPk(userId);
    if (user) {
      await this.notificationService.createForAdmin("PAYMENT_PROOF_UPLOADED", "Payment proof uploaded", `User ${user.email} uploaded a payment proof for reservation ${reservation.id}`);
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
    const reservation = await Reservation.findByPk(payment.reservation_id);
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    payment.status = ok ? "APPROVED" : "REJECTED";
    payment.notes = notes || "";
    await payment.save();
    if (ok) {
      reservation.status = "PAID";
      await reservation.save();
    }
    await this.notificationService.create(payment.user_id, "PAYMENT_STATUS", "Payment reviewed", ok ? "Your payment has been approved" : "Your payment has been rejected");
    return { payment, reservation };
  }
}
