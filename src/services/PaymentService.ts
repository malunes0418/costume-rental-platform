import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { NotificationService } from "./NotificationService";
import { User } from "../models/User";

export class PaymentService {
  constructor(private notificationService: NotificationService) {}

  async uploadProof(userId: number, reservationId: number, proofUrl: string, amount: number) {
    const reservation = await Reservation.findOne({ where: { id: reservationId, user_id: userId } });
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    if (reservation.status !== "PENDING_PAYMENT") {
      throw new Error("Reservation not pending payment");
    }
    const payment = await Payment.create({
      reservation_id: reservation.id,
      user_id: userId,
      amount,
      proof_url: proofUrl,
      status: "PENDING"
    });
    const user = await User.findByPk(userId);
    if (user) {
      await this.notificationService.createForAdmin("PAYMENT_PROOF_UPLOADED", "Payment proof uploaded", `User ${user.email} uploaded a payment proof for reservation ${reservation.id}`);
    }
    return payment;
  }

  async adminReview(paymentId: number, approve: boolean, notes?: string) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    const reservation = await Reservation.findByPk(payment.reservation_id);
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    payment.status = approve ? "APPROVED" : "REJECTED";
    payment.notes = notes || "";
    await payment.save();
    if (approve) {
      reservation.status = "PAID";
      await reservation.save();
    }
    await this.notificationService.create(payment.user_id, "PAYMENT_STATUS", "Payment reviewed", approve ? "Your payment has been approved" : "Your payment has been rejected");
    return { payment, reservation };
  }
}
