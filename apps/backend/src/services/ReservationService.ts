import type { Request } from "express";
import { Op } from "sequelize";
import type { AddToCartRequest, CheckoutRequest, CostumeAvailabilityQuery } from "../dto";
import {
  deriveVendorReservationStatus,
  isBlockingReservationStatus,
  RESERVATION_STATUSES
} from "../domain/reservationLifecycle";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { CostumeImage } from "../models/CostumeImage";
import { NotificationService } from "./NotificationService";
import { countDaysInclusive } from "../utils/dateUtils";
import { calculateReservationPrice } from "../utils/pricing";
import { FulfillmentService } from "./FulfillmentService";
import { HandoffService } from "./HandoffService";
import { presentFulfillmentHandoffProofs } from "../domain/handoffProofs";

export class ReservationService {
  private notificationService = new NotificationService();
  private fulfillmentService = new FulfillmentService();
  private handoffService = new HandoffService();

  private normalizeReservationQuantity(quantity: unknown) {
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return 1;
    }

    return parsed;
  }

  private assertBookableCostume(costume: Costume | null): asserts costume is Costume {
    if (!costume || !costume.is_active || costume.status !== "ACTIVE") {
      throw new Error("Costume is not available for booking");
    }
  }

  private async loadReservationWithItems(reservationId: number) {
    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        {
          model: ReservationItem,
          as: "items",
          include: [
            {
              model: Costume,
              include: [
                CostumeImage,
                {
                  association: "owner",
                  attributes: ["id", "name"],
                  include: [{ model: VendorProfile, attributes: ["business_name"] }]
                }
              ]
            }
          ]
        },
        { association: "fulfillment" },
        { association: "adjustments" }
      ]
    });
    if (!reservation) {
      return null;
    }
    const json = reservation.toJSON();
    return {
      ...json,
      fulfillment: presentFulfillmentHandoffProofs(reservation.id, json.fulfillment)
    };
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
    const blockingStatuses = RESERVATION_STATUSES.filter((status) => isBlockingReservationStatus(status));
    const reservations = await Reservation.findAll({
      include: [
        {
          model: ReservationItem,
          as: "items",
          where: { costume_id: costumeId }
        }
      ],
      where: {
        status: { [Op.in]: blockingStatuses },
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
    this.assertBookableCostume(costume);
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
    const { costumeId, quantity, startDate, endDate, fulfillment } = body;
    const costumeIdNum = Number(costumeId);
    const qty = this.normalizeReservationQuantity(quantity);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const costume = await Costume.findByPk(costumeIdNum);
    this.assertBookableCostume(costume);
    if (costume.owner_id === userId) {
      throw new Error("You cannot add your own costume to your cart");
    }

    await this.validateAvailability(costumeIdNum, start, end, qty);
    const days = countDaysInclusive(start, end);
    const pricing = calculateReservationPrice(
      {
        pricing_mode: costume.pricing_mode,
        base_price_per_day: costume.base_price_per_day,
        package_price: costume.package_price,
        package_included_days: costume.package_included_days,
        package_unused_day_discount: costume.package_unused_day_discount,
        package_extra_day_charge: costume.package_extra_day_charge
      },
      days,
      qty
    );
    const subtotal = pricing.subtotal;
    const preparedFulfillment = await this.fulfillmentService.prepareReservationFulfillment({
      userId,
      costume,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      selection: fulfillment
    });
    const totalWithFulfillment =
      subtotal + Number(preparedFulfillment.outbound_fee) + Number(preparedFulfillment.return_fee);

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
      reservation.total_price = totalWithFulfillment;
      await reservation.save();

      const existingItem = ((reservation as any).items || [])[0] as ReservationItem | undefined;
      if (!existingItem) {
        throw new Error("Reservation item not found");
      }

      existingItem.quantity = qty;
      existingItem.price_per_day = pricing.pricePerDaySnapshot;
      existingItem.pricing_mode = pricing.pricingMode;
      existingItem.package_base_price = pricing.packageBasePrice;
      existingItem.package_included_days = pricing.packageIncludedDays;
      existingItem.package_unused_day_discount = pricing.packageUnusedDayDiscount;
      existingItem.package_extra_day_charge = pricing.packageExtraDayCharge;
      existingItem.subtotal = subtotal;
      await existingItem.save();
      item = existingItem;
    } else {
      reservation = await Reservation.create({
        user_id: userId,
        status: "CART",
        vendor_status: "NOT_REQUIRED",
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        total_price: totalWithFulfillment,
        currency: "PHP"
      });

      item = await ReservationItem.create({
        reservation_id: reservation.id,
        costume_id: costumeIdNum,
        quantity: qty,
        price_per_day: pricing.pricePerDaySnapshot,
        pricing_mode: pricing.pricingMode,
        package_base_price: pricing.packageBasePrice,
        package_included_days: pricing.packageIncludedDays,
        package_unused_day_discount: pricing.packageUnusedDayDiscount,
        package_extra_day_charge: pricing.packageExtraDayCharge,
        subtotal
      });
    }

    await this.fulfillmentService.upsertReservationFulfillment(reservation.id, preparedFulfillment);

    const hydratedReservation = await this.loadReservationWithItems(reservation.id);
    if (!hydratedReservation) {
      throw new Error("Reservation not found after update");
    }

    return { reservation: hydratedReservation, item };
  }

  async checkout(userId: number, body: CheckoutRequest) {
    const { reservationId } = body;
    const buyer = await User.findByPk(userId);
    const reservation = await Reservation.findOne({
      where: { id: Number(reservationId), user_id: userId },
      include: [
        { model: ReservationItem, as: "items", include: [Costume] },
        { association: "fulfillment" }
      ]
    });
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    if (reservation.status !== "CART") {
      throw new Error("Reservation not in cart status");
    }
    if (!(reservation as any).fulfillment) {
      throw new Error("Fulfillment selection is required before checkout");
    }
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date);
    const items = (reservation as any).items as ReservationItem[];
    for (const item of items) {
      await this.validateAvailability(item.costume_id, start, end, item.quantity);
    }
    reservation.status = "PENDING_PAYMENT";
    reservation.vendor_status = deriveVendorReservationStatus("PENDING_PAYMENT", reservation.vendor_status);
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
    const reservations = await Reservation.findAll({
      where: { user_id: userId },
      include: [
        {
          model: ReservationItem,
          as: "items",
          include: [
            {
              model: Costume,
              include: [
                CostumeImage,
                {
                  association: "owner",
                  attributes: ["id", "name"],
                  include: [{ model: VendorProfile, attributes: ["business_name"] }]
                }
              ]
            }
          ]
        },
        { association: "fulfillment" },
        { association: "adjustments" }
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
        payment.reservation_ids.some((id) => Number(id) === Number(reservation.id)) &&
        payment.status !== "REJECTED"
    );

    if (linkedPayment) {
      throw new Error("This reservation already has submitted payment proof and can no longer be removed");
    }

    await ReservationItem.destroy({ where: { reservation_id: reservation.id } });
    await reservation.destroy();

    return { success: true as const };
  }

  async confirmReceived(userId: number, reservationId: number, file?: Express.Multer.File) {
    const reservation = await this.handoffService.confirmRenterReceived(userId, reservationId, file);
    return this.loadReservationWithItems(reservation.id);
  }

  async initiateReturn(userId: number, reservationId: number, file?: Express.Multer.File) {
    const reservation = await this.handoffService.initiateReturn(userId, reservationId, file);
    return this.loadReservationWithItems(reservation.id);
  }

  async cancelReservation(userId: number, reservationId: number) {
    const reservation = await this.handoffService.cancelReservationByRenter(userId, reservationId);
    return this.loadReservationWithItems(reservation.id);
  }

  async getHandoffProofFileForViewer(userId: number, reservationId: number, type: string) {
    return this.handoffService.getHandoffProofFileForViewer(userId, reservationId, type);
  }
}
