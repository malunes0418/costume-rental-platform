import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Payment } from "../models/Payment";
import { Costume } from "../models/Costume";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";

export class AdminService {
  async listReservations() {
    return Reservation.findAll({
      include: [{ model: ReservationItem, as: "items", include: [Costume] }, User],
      order: [["created_at", "DESC"]]
    });
  }

  async listPayments() {
    return Payment.findAll({ include: [Reservation, User], order: [["created_at", "DESC"]] });
  }

  async listInventory() {
    return Costume.findAll();
  }

  async listUsers() {
    return User.findAll();
  }

  // --- Vendor Moderation ---
  async listPendingVendors() {
    return User.findAll({
      where: { vendor_status: "PENDING" },
      include: [VendorProfile]
    });
  }

  async updateVendorStatus(userId: number, status: "APPROVED" | "REJECTED") {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.vendor_status = status;
    await user.save();
    return user;
  }

  async updateCostumeStatus(costumeId: number, status: "ACTIVE" | "HIDDEN" | "FLAGGED") {
    const costume = await Costume.findByPk(costumeId);
    if (!costume) throw new Error("Costume not found");
    costume.status = status;
    await costume.save();
    return costume;
  }
}
