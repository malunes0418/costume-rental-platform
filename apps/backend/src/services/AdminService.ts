import { Op } from "sequelize";
import {
  assertReservationTransition,
  deriveVendorReservationStatus,
  isReservationStatus
} from "../domain/reservationLifecycle";
import { ReservationItem } from "../models/ReservationItem";
import { Payment } from "../models/Payment";
import { Costume } from "../models/Costume";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { Reservation } from "../models/Reservation";

export class AdminService {
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

    const userIds = [...new Set(reservations.map((reservation) => Number(reservation.user_id)).filter(Boolean))];
    const payments = userIds.length
      ? await Payment.findAll({
          where: { user_id: { [Op.in]: userIds } },
          include: [{ association: "reservationAdjustment", required: false }],
          order: [["created_at", "DESC"]]
        })
      : [];

    return reservations.map((reservation) => {
      const reservationJson = reservation.toJSON();
      const matchingPayments = payments
        .filter((payment) =>
          Array.isArray(payment.reservation_ids) &&
          payment.reservation_ids.some((paymentReservationId) => Number(paymentReservationId) === Number(reservation.id))
        )
        .map((payment) => payment.toJSON());

      return {
        ...reservationJson,
        payments: matchingPayments
      };
    });
  }

  async updateReservationStatus(reservationId: number, status: string) {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (!isReservationStatus(status)) {
      throw new Error("Invalid reservation status");
    }
    assertReservationTransition(reservation.status, status, "Reservation");
    reservation.status = status;
    reservation.vendor_status = deriveVendorReservationStatus(status, reservation.vendor_status);
    await reservation.save();
    return reservation;
  }

  async listPayments() {
    return Payment.findAll({
      include: [User, { association: "reservationAdjustment", required: false }],
      order: [["created_at", "DESC"]]
    });
  }

  async listInventory() {
    return Costume.findAll();
  }

  async listUsers() {
    return User.findAll();
  }

  async updateUserRole(userId: number, role: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.role = role as any;
    await user.save();
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

  async updateVendorStatus(userId: number, status: "APPROVED" | "REJECTED", reviewNote?: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    const profile = await VendorProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw new Error("Vendor profile not found");
    user.vendor_status = status;
    await user.save();
    profile.review_note = reviewNote || null;
    profile.reviewed_at = new Date();
    await profile.save();
    return user;
  }

  async updateCostumeStatus(costumeId: number, status: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED") {
    const costume = await Costume.findByPk(costumeId);
    if (!costume) throw new Error("Costume not found");
    costume.status = status;
    costume.is_active = status === "ACTIVE" ? true : costume.is_active;
    await costume.save();
    return costume;
  }
}
