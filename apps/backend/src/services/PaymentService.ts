import type { AdminReviewPaymentRequest, UploadPaymentProofRequest } from "../dto";
import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
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

    const reservations: Reservation[] = [];

    // Verify all reservations
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

    const reservationOwners = await Reservation.findAll({
      where: { id: parsedIds, user_id: userId },
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

    const proofUrl = `/uploads/${file.filename}`;
    const payment = await Payment.create({
      reservation_ids: parsedIds,
      user_id: userId,
      amount: Number(amount),
      proof_url: proofUrl,
      status: "PENDING"
    });

    for (const reservation of reservations) {
      reservation.vendor_status = "PENDING_VENDOR";
      await reservation.save();
    }
    
    const user = await User.findByPk(userId);
    if (user) {
      await this.notificationService.createForAdmin("PAYMENT_PROOF_UPLOADED", "Payment proof uploaded", `User ${user.email} uploaded a payment proof for reservations: ${parsedIds.join(", ")}`);
    }

    const vendorMessages = new Map<number, string[]>();
    for (const reservation of reservationOwners) {
      const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
      for (const item of items) {
        const vendorId = Number(item.Costume?.owner_id);
        if (!vendorId) continue;
        const entries = vendorMessages.get(vendorId) || [];
        entries.push(`#${reservation.id}`);
        vendorMessages.set(vendorId, entries);
      }
    }

    for (const [vendorId, reservationRefs] of vendorMessages.entries()) {
      const uniqueReservations = [...new Set(reservationRefs)];
      await this.notificationService.create(
        vendorId,
        "PAYMENT_PROOF_UPLOADED",
        "New payment receipt to review",
        `A renter uploaded payment proof for reservation${uniqueReservations.length === 1 ? "" : "s"} ${uniqueReservations.join(", ")}. Review the receipt in your vendor dashboard.`
      );
    }

    return payment;
  }

  async listForUser(userId: number) {
    return Payment.findAll({ where: { user_id: userId } });
  }

  async adminReview({ paymentId, approve, status, notes }: AdminReviewPaymentRequest) {
    const id = Number(paymentId);
    const ok = status ? status === "APPROVED" : typeof approve === "boolean" ? approve : Boolean(approve);
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
