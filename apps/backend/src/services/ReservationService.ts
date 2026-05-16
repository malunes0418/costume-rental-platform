import type { Request } from "express";
import { Op } from "sequelize";
import type { AddToCartRequest, CheckoutRequest, CostumeAvailabilityQuery } from "../dto";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { countDaysInclusive } from "../utils/dateUtils";

export class ReservationService {
  async availabilityForCostumeRoute(params: Request["params"], query: Request["query"]) {
    const { startDate, endDate } = query as Partial<CostumeAvailabilityQuery>;
    if (!startDate || !endDate) {
      throw new Error("startDate and endDate are required");
    }
    const start = typeof startDate === "string" ? startDate : String(startDate);
    const end = typeof endDate === "string" ? endDate : String(endDate);
    return this.getAvailability(Number(params.id), new Date(start), new Date(end));
  }

  async getAvailability(costumeId: number, startDate: Date, endDate: Date) {
    const reservations = await Reservation.findAll({
      include: [
        {
          model: ReservationItem,
          as: "items",
          where: { costume_id: costumeId }
        }
      ],
      where: {
        status: { [Op.in]: ["PENDING_PAYMENT", "PAID"] },
        [Op.or]: [
          { start_date: { [Op.between]: [startDate, endDate] } },
          { end_date: { [Op.between]: [startDate, endDate] } },
          {
            start_date: { [Op.lte]: startDate },
            end_date: { [Op.gte]: endDate }
          }
        ]
      }
    });
    return reservations;
  }

  async validateAvailability(costumeId: number, startDate: Date, endDate: Date, quantity: number) {
    const costume = await Costume.findByPk(costumeId);
    if (!costume) {
      throw new Error("Costume not found");
    }
    const existingReservations = await this.getAvailability(costumeId, startDate, endDate);
    let reservedQuantity = 0;
    for (const res of existingReservations) {
      const items = (res as any).items as ReservationItem[];
      for (const item of items) {
        reservedQuantity += item.quantity;
      }
    }
    const available = costume.stock - reservedQuantity;
    if (available < quantity) {
      throw new Error("Insufficient availability for selected dates");
    }
  }

  async addToCart(userId: number, body: AddToCartRequest) {
    const { costumeId, quantity, startDate, endDate } = body;
    const costumeIdNum = Number(costumeId);
    const qty = Number(quantity);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const costume = await Costume.findByPk(costumeIdNum);
    if (!costume) {
      throw new Error("Costume not found");
    }
    if (costume.owner_id === userId) {
      throw new Error("You cannot add your own costume to your cart");
    }

    await this.validateAvailability(costumeIdNum, start, end, qty);
    let reservation = await Reservation.findOne({ where: { user_id: userId, status: "CART" }, include: [{ model: ReservationItem, as: "items" }] });
    if (!reservation) {
      reservation = await Reservation.create({
        user_id: userId,
        status: "CART",
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        total_price: 0,
        currency: "PHP"
      });
    } else {
      reservation.start_date = start.toISOString().slice(0, 10);
      reservation.end_date = end.toISOString().slice(0, 10);
      await reservation.save();
    }
    const days = countDaysInclusive(start, end);
    const pricePerDay = Number(costume.base_price_per_day);
    const subtotal = pricePerDay * days * qty;
    const item = await ReservationItem.create({
      reservation_id: reservation.id,
      costume_id: costumeIdNum,
      quantity: qty,
      price_per_day: pricePerDay,
      subtotal
    });
    const items = await ReservationItem.findAll({ where: { reservation_id: reservation.id } });
    const total = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
    reservation.total_price = total;
    await reservation.save();
    return { reservation, item };
  }

  async checkout(userId: number, body: CheckoutRequest) {
    const { reservationId } = body;
    const reservation = await Reservation.findOne({
      where: { id: Number(reservationId), user_id: userId },
      include: [{ model: ReservationItem, as: "items" }]
    });
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    if (reservation.status !== "CART") {
      throw new Error("Reservation not in cart status");
    }
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date);
    const items = (reservation as any).items as ReservationItem[];
    for (const item of items) {
      await this.validateAvailability(item.costume_id, start, end, item.quantity);
    }
    reservation.status = "PENDING_PAYMENT";
    await reservation.save();
    return reservation;
  }

  async listUserReservations(userId: number) {
    return Reservation.findAll({
      where: { user_id: userId },
      include: [{ model: ReservationItem, as: "items", include: [Costume] }],
      order: [["created_at", "DESC"]]
    });
  }
}
