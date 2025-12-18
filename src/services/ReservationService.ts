import { Op, Transaction } from "sequelize";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { countDaysInclusive } from "../utils/dateUtils";
import { sequelize } from "../config/db";

export class ReservationService {
  async getAvailability(costumeId: number, startDate: Date, endDate: Date, transaction?: Transaction) {
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
      },
      transaction
    });
    return reservations;
  }

  async validateAvailability(costumeId: number, startDate: Date, endDate: Date, quantity: number, transaction?: Transaction) {
    const costume = await Costume.findByPk(costumeId, { transaction });
    if (!costume) {
      throw new Error("Costume not found");
    }
    const existingReservations = await this.getAvailability(costumeId, startDate, endDate, transaction);
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

  async addToCart(userId: number, costumeId: number, quantity: number, startDate: Date, endDate: Date) {
    return sequelize.transaction(async (transaction) => {
      await this.validateAvailability(costumeId, startDate, endDate, quantity, transaction);
      let reservation = await Reservation.findOne({
        where: { user_id: userId, status: "CART" },
        include: [{ model: ReservationItem, as: "items" }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!reservation) {
        reservation = await Reservation.create({
          user_id: userId,
          status: "CART",
          start_date: startDate.toISOString().slice(0, 10),
          end_date: endDate.toISOString().slice(0, 10),
          total_price: 0,
          currency: "USD"
        }, { transaction });
      } else {
        reservation.start_date = startDate.toISOString().slice(0, 10);
        reservation.end_date = endDate.toISOString().slice(0, 10);
        await reservation.save({ transaction });
      }
      const costume = await Costume.findByPk(costumeId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!costume) {
        throw new Error("Costume not found");
      }
      const days = countDaysInclusive(startDate, endDate);
      const pricePerDay = Number(costume.base_price_per_day);
      const subtotal = pricePerDay * days * quantity;
      const item = await ReservationItem.create({
        reservation_id: reservation.id,
        costume_id: costumeId,
        quantity,
        price_per_day: pricePerDay,
        subtotal
      }, { transaction });
      const items = await ReservationItem.findAll({ where: { reservation_id: reservation.id }, transaction });
      const total = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
      reservation.total_price = total;
      await reservation.save({ transaction });
      return { reservation, item };
    });
  }

  async checkout(userId: number, reservationId: number) {
    return sequelize.transaction(async (transaction) => {
      const reservation = await Reservation.findOne({
        where: { id: reservationId, user_id: userId },
        include: [{ model: ReservationItem, as: "items" }],
        transaction,
        lock: transaction.LOCK.UPDATE
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
        await this.validateAvailability(item.costume_id, start, end, item.quantity, transaction);
      }
      reservation.status = "PENDING_PAYMENT";
      await reservation.save({ transaction });
      return reservation;
    });
  }

  async listUserReservations(userId: number) {
    return Reservation.findAll({
      where: { user_id: userId },
      include: [{ model: ReservationItem, as: "items", include: [Costume] }],
      order: [["created_at", "DESC"]]
    });
  }
}
