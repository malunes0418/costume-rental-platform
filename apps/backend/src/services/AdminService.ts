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

    return reservations.map((reservation) => {
      const json = reservation.toJSON();
      return {
        ...json,
        fulfillment: presentFulfillmentHandoffProofs(reservation.id, json.fulfillment)
      };
    });
  }

  async updateReservationStatus(reservationId: number, status: string) {
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

    assertReservationTransition(reservation.status, status, "Reservation");
    reservation.status = status;
    reservation.vendor_status = deriveVendorReservationStatus(status, reservation.vendor_status);
    await reservation.save();
    return reservation;
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
