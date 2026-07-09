import { DeliveryOrder } from "../../models/DeliveryOrder";
import { ReservationItem } from "../../models/ReservationItem";
import { Costume } from "../../models/Costume";
import { NotificationService } from "../NotificationService";

// ─── Lalamove webhook payload shapes ────────────────────────────────────────

export interface LalamoveWebhookPayload {
  eventType: string;
  /** Applies to ORDER_STATUS_CHANGED */
  status?: string;
  orderId?: string;
  order?: {
    id?: string;
    status?: string;
    driverInfo?: {
      name?: string;
      phone?: string;
    };
    shareLink?: string;
  };
}

// ─── Status mapping ──────────────────────────────────────────────────────────

/** Map Lalamove status strings to internal meaning. */
export function mapLalamoveStatus(status: string): string {
  const normalized = status.toUpperCase();
  // Passthrough — we store the raw Lalamove status; mapping is for notification routing
  return normalized;
}

/**
 * Determines what action to take for a given Lalamove order status.
 * Returns a string tag consumed by the webhook handler.
 */
export function classifyLalamoveEvent(eventType: string, status?: string): string {
  if (eventType === "DRIVER_ASSIGNED") return "DRIVER_ASSIGNED";
  if (eventType === "POD_STATUS_CHANGED") return "POD_UPDATED";
  if (eventType !== "ORDER_STATUS_CHANGED") return "IGNORED";

  const s = (status ?? "").toUpperCase();
  if (s === "PICKED_UP") return "PICKED_UP";
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "CANCELED" || s === "CANCELLED" || s === "EXPIRED" || s === "REJECTED") return "FAILED";
  return "STATUS_UPDATED";
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export class LalamoveWebhookService {
  private notificationService = new NotificationService();

  async handleWebhook(payload: LalamoveWebhookPayload): Promise<void> {
    const orderId = payload.orderId ?? payload.order?.id;
    if (!orderId) return;

    const deliveryOrder = await DeliveryOrder.findOne({ where: { lalamove_order_id: orderId } });
    if (!deliveryOrder) {
      // Unknown order — idempotent; nothing to update
      return;
    }

    const status = payload.status ?? payload.order?.status;
    const driverInfo = payload.order?.driverInfo;
    const shareLink = payload.order?.shareLink;

    // Persist raw payload and update driver/status fields
    const updates: Partial<{
      status: string;
      driver_name: string | null;
      driver_phone: string | null;
      share_link: string | null;
      raw_webhook_payload: Record<string, unknown>;
    }> = {
      raw_webhook_payload: payload as unknown as Record<string, unknown>
    };

    if (status) updates.status = status.toUpperCase();
    if (driverInfo?.name) updates.driver_name = driverInfo.name;
    if (driverInfo?.phone) updates.driver_phone = driverInfo.phone;
    if (shareLink) updates.share_link = shareLink;

    await deliveryOrder.update(updates);

    const tag = classifyLalamoveEvent(payload.eventType, status);
    await this.dispatchNotification(deliveryOrder, tag);
  }

  private async dispatchNotification(
    deliveryOrder: DeliveryOrder,
    tag: string
  ): Promise<void> {
    const reservationId = deliveryOrder.reservation_id;
    const renterId = await this.resolveRenterId(reservationId);
    const vendorId = await this.resolveVendorId(reservationId);

    switch (tag) {
      case "DRIVER_ASSIGNED":
        if (renterId) {
          await this.notificationService.create(
            renterId,
            "RESERVATION_FULFILLMENT_UPDATED",
            "Driver assigned",
            `Your costume for reservation #${reservationId} has a driver assigned. Track your delivery in the app.`
          );
        }
        break;

      case "PICKED_UP":
        if (renterId) {
          await this.notificationService.create(
            renterId,
            "RESERVATION_FULFILLMENT_UPDATED",
            "Out for delivery",
            `Your costume for reservation #${reservationId} is out for delivery.`
          );
        }
        break;

      case "COMPLETED":
        if (deliveryOrder.leg === "OUTBOUND" && renterId) {
          await this.notificationService.create(
            renterId,
            "RESERVATION_FULFILLMENT_UPDATED",
            "Costume delivered",
            `Your costume for reservation #${reservationId} has been delivered. Please confirm receipt with a photo.`
          );
        } else if (deliveryOrder.leg === "RETURN" && vendorId) {
          await this.notificationService.create(
            vendorId,
            "RESERVATION_FULFILLMENT_UPDATED",
            "Return arriving",
            `The return for reservation #${reservationId} has been delivered. Please confirm receipt.`
          );
        }
        break;

      case "FAILED":
        if (vendorId) {
          await this.notificationService.create(
            vendorId,
            "RESERVATION_FULFILLMENT_UPDATED",
            "Delivery failed",
            `The Lalamove delivery for reservation #${reservationId} was cancelled or failed. Please re-dispatch manually.`
          );
        }
        break;

      default:
        break;
    }
  }

  private async resolveRenterId(reservationId: number): Promise<number | null> {
    const { Reservation } = await import("../../models/Reservation");
    const reservation = await Reservation.findByPk(reservationId, {
      attributes: ["user_id"]
    });
    return reservation ? Number(reservation.user_id) : null;
  }

  private async resolveVendorId(reservationId: number): Promise<number | null> {
    const item = await ReservationItem.findOne({
      where: { reservation_id: reservationId },
      include: [{ model: Costume, attributes: ["owner_id"] }]
    });
    return item ? Number((item as any).Costume?.owner_id) || null : null;
  }
}
