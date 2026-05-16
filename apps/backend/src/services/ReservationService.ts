import type { Request } from "express";
import { Op } from "sequelize";
import type { AddToCartRequest, CheckoutRequest, CostumeAvailabilityQuery } from "../dto";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { NotificationService } from "./NotificationService";
import { countDaysInclusive } from "../utils/dateUtils";

export class ReservationService {
  private notificationService = new NotificationService();

  private async loadReservationWithItems(reservationId: number) {
    return Reservation.findByPk(reservationId, {
      include: [{ model: ReservationItem, as: "items", include: [Costume] }]
    });
  }

  private buyerLabel(user?: User | null) {
    if (!user) return "A renter";
    return user.name || user.email || `User #${user.id}`;
  }

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

    const buyer = await User.findByPk(userId);

    await this.validateAvailability(costumeIdNum, start, end, qty);
    const days = countDaysInclusive(start, end);
    const pricePerDay = Number(costume.base_price_per_day);
    const subtotal = pricePerDay * days * qty;

    const existingReservation = await Reservation.findOne({
      where: { user_id: userId, status: "CART" },
      include: [
        {
          model: ReservationItem,
          as: "items",
          where: { costume_id: costumeIdNum },
          required: true
        }
      ]
    });

    let reservation = existingReservation;
    let item: ReservationItem;

    if (reservation) {
      reservation.start_date = start.toISOString().slice(0, 10);
      reservation.end_date = end.toISOString().slice(0, 10);
      reservation.total_price = subtotal;
      await reservation.save();

      const existingItem = ((reservation as any).items || [])[0] as ReservationItem | undefined;
      if (!existingItem) {
        throw new Error("Reservation item not found");
      }

      existingItem.quantity = qty;
      existingItem.price_per_day = pricePerDay;
      existingItem.subtotal = subtotal;
      await existingItem.save();
      item = existingItem;
    } else {
      reservation = await Reservation.create({
        user_id: userId,
        status: "CART",
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        total_price: subtotal,
        currency: "PHP"
      });

      item = await ReservationItem.create({
        reservation_id: reservation.id,
        costume_id: costumeIdNum,
        quantity: qty,
        price_per_day: pricePerDay,
        subtotal
      });
    }

    const hydratedReservation = await this.loadReservationWithItems(reservation.id);
    if (!hydratedReservation) {
      throw new Error("Reservation not found after update");
    }

    if (costume.owner_id) {
      await this.notificationService.create(
        Number(costume.owner_id),
        "COSTUME_ADDED_TO_CART",
        "Costume added to cart",
        `${this.buyerLabel(buyer)} added ${costume.name} to their cart for ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}.`
      );
    }

    return { reservation: hydratedReservation, item };
  }

  async checkout(userId: number, body: CheckoutRequest) {
    const { reservationId } = body;
    const buyer = await User.findByPk(userId);
    const reservation = await Reservation.findOne({
      where: { id: Number(reservationId), user_id: userId },
      include: [{ model: ReservationItem, as: "items", include: [Costume] }]
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

    const reservationItems = (reservation as any).items as Array<ReservationItem & { Costume?: Costume }>;
    const firstCostume = reservationItems?.[0]?.Costume;
    if (firstCostume?.owner_id) {
      await this.notificationService.create(
        Number(firstCostume.owner_id),
        "RESERVATION_CHECKED_OUT",
        "Reservation checked out",
        `${this.buyerLabel(buyer)} checked out ${firstCostume.name} and is preparing payment for reservation #${reservation.id}.`
      );
    }

    return reservation;
  }

  async listUserReservations(userId: number) {
    return Reservation.findAll({
      where: { user_id: userId },
      include: [{
        model: ReservationItem,
        as: "items",
        include: [{
          model: Costume,
          include: [{
            association: "owner",
            attributes: ["id", "name"],
            include: [{ model: VendorProfile, attributes: ["business_name"] }]
          }]
        }]
      }],
      order: [["created_at", "DESC"]]
    });
  }

  async removeReservation(userId: number, reservationId: number) {
    const reservation = await Reservation.findOne({
      where: { id: reservationId, user_id: userId }
    });

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (!["CART", "PENDING_PAYMENT"].includes(reservation.status)) {
      throw new Error("Only cart or unpaid reservations can be removed");
    }

    const payments = await Payment.findAll({ where: { user_id: userId } });
    const linkedPayment = payments.find(
      (payment) =>
        Array.isArray(payment.reservation_ids) &&
        payment.reservation_ids.some((id) => Number(id) === Number(reservation.id))
    );

    if (linkedPayment) {
      throw new Error("This reservation already has submitted payment proof and can no longer be removed");
    }

    await ReservationItem.destroy({ where: { reservation_id: reservation.id } });
    await reservation.destroy();

    return { success: true as const };
  }
}
