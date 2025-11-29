import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Payment } from "../models/Payment";
import { Costume } from "../models/Costume";
import { User } from "../models/User";

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
}
