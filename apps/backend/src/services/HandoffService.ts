import { Op } from "sequelize";
import {
  assertReservationTransition,
  deriveVendorReservationStatus,
  type ReservationStatus
} from "../domain/reservationLifecycle";
import {
  getHandoffProofColumn,
  isHandoffProofType,
  presentFulfillmentHandoffProofs,
  type HandoffProofType
} from "../domain/handoffProofs";
import { Costume } from "../models/Costume";
import { Reservation } from "../models/Reservation";
import { ReservationFulfillment } from "../models/ReservationFulfillment";
import { ReservationItem } from "../models/ReservationItem";
import { VendorFulfillmentSettings } from "../models/VendorFulfillmentSettings";
import { User } from "../models/User";
import { NotificationService } from "./NotificationService";
import { assertNoBlockingPaymentForRenterCancel } from "./reservationPaymentGuards";
import { LalamoveOrderService, type BookedDeliveryResult } from "./lalamove/LalamoveOrderService";
import { PayoutService } from "./PayoutService";
import { uploadPublicPath } from "../middleware/uploadMiddleware";
import type { LocationSnapshot } from "../domain/fulfillment";

export class HandoffService {
  private notificationService = new NotificationService();
  private lalamoveOrderService = new LalamoveOrderService();
  private payoutService = new PayoutService();

  private formatLifecycleLabel(status: ReservationStatus) {
    return status.toLowerCase().split("_").join(" ");
  }

  private proofStoragePath(file: Express.Multer.File) {
    return uploadPublicPath(file);
  }

  private async findReservationForRenter(reservationId: number, userId: number) {
    const reservation = await Reservation.findOne({
      where: { id: reservationId, user_id: userId },
      include: [{ association: "fulfillment" }]
    });
    if (!reservation) {
      throw new Error("Reservation not found");
    }
    return reservation;
  }

  private async findReservationForVendor(reservationId: number, vendorId: number) {
    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        {
          association: "items",
          include: [{ model: Costume, attributes: ["id", "name", "owner_id"], required: true }],
          required: true
        },
        { association: "fulfillment" },
        { model: User, attributes: ["id", "name", "email"] }
      ]
    });
    if (!reservation) {
      throw new Error("Reservation not found or unauthorized");
    }
    const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
    const ownsItem = items.some((item) => Number(item.Costume?.owner_id) === Number(vendorId));
    if (!ownsItem) {
      throw new Error("Reservation not found or unauthorized");
    }
    return reservation;
  }

  private async requireFulfillment(reservationId: number) {
    const fulfillment = await ReservationFulfillment.findOne({ where: { reservation_id: reservationId } });
    if (!fulfillment) {
      throw new Error("Reservation fulfillment details are missing");
    }
    return fulfillment;
  }

  private async applyProof(
    fulfillment: ReservationFulfillment,
    column:
      | "outbound_dispatch_proof_url"
      | "renter_received_proof_url"
      | "return_initiated_proof_url"
      | "vendor_return_proof_url",
    file?: Express.Multer.File,
    required = false
  ) {
    if (!file) {
      if (required) {
        throw new Error("A photo proof is required for this handoff step");
      }
      return;
    }
    fulfillment[column] = this.proofStoragePath(file);
  }

  async quoteDispatch(vendorId: number, reservationId: number): Promise<{
    provider: string;
    quote: import("./lalamove/LalamoveOrderService").DispatchQuoteResult | null;
  }> {
    const reservation = await this.findReservationForVendor(reservationId, vendorId);
    const fulfillment = await this.requireFulfillment(reservation.id);

    const settings = await this.lalamoveOrderService.getLalamoveSettings(vendorId);
    if (!settings || fulfillment.outbound_method !== "DELIVERY") {
      return { provider: "MANUAL", quote: null };
    }

    const vendorLoc = settings.primary_location as LocationSnapshot | null;
    const renterLoc = fulfillment.outbound_location_snapshot as LocationSnapshot | null;

    if (!vendorLoc?.latitude || !vendorLoc?.longitude || !renterLoc?.latitude || !renterLoc?.longitude) {
      return { provider: "LALAMOVE", quote: null };
    }

    const serviceType = settings.lalamove_service_type ?? "MOTORCYCLE";
    const quote = await this.lalamoveOrderService.quoteOutbound(vendorLoc, renterLoc, serviceType);
    return { provider: "LALAMOVE", quote };
  }

  async dispatchReservation(vendorId: number, reservationId: number, file?: Express.Multer.File): Promise<{
    reservation: Reservation;
    delivery_order: BookedDeliveryResult | null;
  }> {
    const reservation = await this.findReservationForVendor(reservationId, vendorId);
    assertReservationTransition(reservation.status, "DELIVERY_SCHEDULED", "Reservation");

    const fulfillment = await this.requireFulfillment(reservation.id);

    // Attempt Lalamove booking when the vendor is configured for LALAMOVE delivery
    let deliveryOrder: BookedDeliveryResult | null = null;
    const settings = await this.lalamoveOrderService.getLalamoveSettings(vendorId);
    if (settings && fulfillment.outbound_method === "DELIVERY") {
      const vendorLoc = settings.primary_location as LocationSnapshot | null;
      const renterLoc = fulfillment.outbound_location_snapshot as LocationSnapshot | null;
      const serviceType = settings.lalamove_service_type ?? "MOTORCYCLE";

      if (vendorLoc?.latitude && vendorLoc?.longitude && renterLoc?.latitude && renterLoc?.longitude) {
        // Throws on 402 (insufficient wallet) or other API errors — caller should surface to vendor
        deliveryOrder = await this.lalamoveOrderService.bookOutbound(
          reservation.id,
          vendorLoc,
          renterLoc,
          serviceType,
          Number(fulfillment.outbound_fee)
        );
      }
    }

    fulfillment.outbound_dispatched_at = new Date();
    // Proof is optional when Lalamove is handling POD
    await this.applyProof(fulfillment, "outbound_dispatch_proof_url", file, false);
    await fulfillment.save();

    reservation.status = "DELIVERY_SCHEDULED";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    const notificationBody = deliveryOrder
      ? `Reservation #${reservation.id} has been dispatched via Lalamove. Track your delivery using the link in your reservation details.`
      : `Reservation #${reservation.id} is now ready for handoff. Please confirm when you receive the costume with a photo.`;

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_FULFILLMENT_UPDATED",
      "Costume dispatched",
      notificationBody
    );

    return { reservation, delivery_order: deliveryOrder };
  }

  async confirmRenterReceived(userId: number, reservationId: number, file?: Express.Multer.File) {
    const reservation = await this.findReservationForRenter(reservationId, userId);
    assertReservationTransition(reservation.status, "WITH_RENTER", "Reservation");

    const fulfillment = await this.requireFulfillment(reservation.id);
    fulfillment.renter_received_at = new Date();
    await this.applyProof(fulfillment, "renter_received_proof_url", file, true);
    await fulfillment.save();

    reservation.status = "WITH_RENTER";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    const vendorId = await this.resolveVendorId(reservation.id);
    if (vendorId) {
      await this.notificationService.create(
        vendorId,
        "RESERVATION_FULFILLMENT_UPDATED",
        "Renter confirmed receipt",
        `The renter confirmed receipt for reservation #${reservation.id}.`
      );
    }

    return reservation;
  }

  async initiateReturn(userId: number, reservationId: number, file?: Express.Multer.File): Promise<{
    reservation: Reservation;
    delivery_order: BookedDeliveryResult | null;
  }> {
    const reservation = await this.findReservationForRenter(reservationId, userId);
    assertReservationTransition(reservation.status, "RETURN_PENDING", "Reservation");

    const fulfillment = await this.requireFulfillment(reservation.id);

    // Attempt Lalamove booking for the return leg
    let deliveryOrder: BookedDeliveryResult | null = null;
    const vendorId = await this.resolveVendorId(reservation.id);
    if (vendorId) {
      const settings = await this.lalamoveOrderService.getLalamoveSettings(vendorId);
      if (settings && fulfillment.return_method === "DELIVERY") {
        const renterLoc = fulfillment.return_location_snapshot as LocationSnapshot | null;
        const vendorLoc = settings.primary_location as LocationSnapshot | null;
        const serviceType = settings.lalamove_service_type ?? "MOTORCYCLE";

        if (renterLoc?.latitude && renterLoc?.longitude && vendorLoc?.latitude && vendorLoc?.longitude) {
          // Throws on 402 or other API errors — surface to renter
          deliveryOrder = await this.lalamoveOrderService.bookReturn(
            reservation.id,
            renterLoc,
            vendorLoc,
            serviceType,
            Number(fulfillment.return_fee)
          );
        }
      }
    }

    fulfillment.return_initiated_at = new Date();
    // Proof required for manual returns; optional when Lalamove handles POD
    await this.applyProof(fulfillment, "return_initiated_proof_url", file, !deliveryOrder);
    await fulfillment.save();

    reservation.status = "RETURN_PENDING";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    if (vendorId) {
      const notificationBody = deliveryOrder
        ? `The renter initiated a return for reservation #${reservation.id} via Lalamove. You will be notified when the delivery arrives.`
        : `The renter initiated a return for reservation #${reservation.id}.`;
      await this.notificationService.create(
        vendorId,
        "RESERVATION_FULFILLMENT_UPDATED",
        "Return initiated",
        notificationBody
      );
    }

    return { reservation, delivery_order: deliveryOrder };
  }

  async confirmVendorReturn(vendorId: number, reservationId: number, file?: Express.Multer.File) {
    const reservation = await this.findReservationForVendor(reservationId, vendorId);
    assertReservationTransition(reservation.status, "RETURNED", "Reservation");

    const fulfillment = await this.requireFulfillment(reservation.id);
    fulfillment.vendor_return_received_at = new Date();
    await this.applyProof(fulfillment, "vendor_return_proof_url", file, false);
    await fulfillment.save();

    reservation.status = "RETURNED";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_FULFILLMENT_UPDATED",
      "Return received",
      `The vendor confirmed the costume return for reservation #${reservation.id}.`
    );

    return reservation;
  }

  async completeReservation(vendorId: number, reservationId: number) {
    const reservation = await this.findReservationForVendor(reservationId, vendorId);
    assertReservationTransition(reservation.status, "COMPLETED", "Reservation");

    reservation.status = "COMPLETED";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    await this.payoutService.syncEligibleEntries();

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_FULFILLMENT_UPDATED",
      "Rental completed",
      `Reservation #${reservation.id} is now completed.`
    );

    return reservation;
  }

  async cancelReservationByRenter(userId: number, reservationId: number) {
    const reservation = await this.findReservationForRenter(reservationId, userId);
    if (reservation.status !== "PENDING_PAYMENT") {
      throw new Error("Only unpaid reservations can be cancelled by the renter");
    }

    await assertNoBlockingPaymentForRenterCancel(reservation);
    assertReservationTransition(reservation.status, "CANCELLED", "Reservation");

    reservation.status = "CANCELLED";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    const vendorId = await this.resolveVendorId(reservation.id);
    if (vendorId) {
      await this.notificationService.create(
        vendorId,
        "RESERVATION_CANCELLED",
        "Reservation cancelled",
        `Reservation #${reservation.id} was cancelled by the renter before payment completed.`
      );
    }

    return reservation;
  }

  async getHandoffProofFileForViewer(userId: number, reservationId: number, type: string) {
    if (!isHandoffProofType(type)) {
      throw new Error("Handoff proof not found");
    }

    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        {
          association: "items",
          include: [{ model: Costume, attributes: ["owner_id"], required: true }],
          required: true
        },
        { association: "fulfillment" }
      ]
    });
    if (!reservation) {
      throw new Error("Handoff proof not found");
    }

    const fulfillment = (reservation as any).fulfillment as ReservationFulfillment | null;
    if (!fulfillment) {
      throw new Error("Handoff proof not found");
    }

    const column = getHandoffProofColumn(type);
    const proofUrl = fulfillment[column];
    if (!proofUrl) {
      throw new Error("Handoff proof not found");
    }

    const isRenter = Number(reservation.user_id) === Number(userId);
    const items = ((reservation as any).items || []) as Array<ReservationItem & { Costume?: Costume }>;
    const isVendor = items.some((item) => Number(item.Costume?.owner_id) === Number(userId));

    if (!isRenter && !isVendor) {
      throw new Error("Handoff proof not found");
    }

    return proofUrl;
  }

  async isProtectedUploadPath(uploadPath: string) {
    const normalized = uploadPath.replace(/^\/+/, "");
    const fulfillment = await ReservationFulfillment.findOne({
      where: {
        [Op.or]: [
          { outbound_dispatch_proof_url: `/uploads/${normalized}` },
          { renter_received_proof_url: `/uploads/${normalized}` },
          { return_initiated_proof_url: `/uploads/${normalized}` },
          { vendor_return_proof_url: `/uploads/${normalized}` }
        ]
      }
    });
    return Boolean(fulfillment);
  }

  presentReservation<T extends { id: number; fulfillment?: ReservationFulfillment | null }>(reservation: T) {
    const json = typeof (reservation as any).toJSON === "function" ? (reservation as any).toJSON() : reservation;
    return {
      ...json,
      fulfillment: presentFulfillmentHandoffProofs(reservation.id, json.fulfillment)
    };
  }

  private async resolveVendorId(reservationId: number) {
    const item = await ReservationItem.findOne({
      where: { reservation_id: reservationId },
      include: [{ model: Costume, attributes: ["owner_id"] }]
    });
    return item ? Number((item as any).Costume?.owner_id) || null : null;
  }
}
