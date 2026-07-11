import { VendorFulfillmentSettings } from "../../models/VendorFulfillmentSettings";
import { ReservationFulfillment } from "../../models/ReservationFulfillment";
import { DeliveryOrder } from "../../models/DeliveryOrder";
import { LalamoveClient, LalamoveApiError } from "./LalamoveClient";
import { buildQuotationPayload, parseQuotedPrice } from "./LalamoveQuoteHelper";
import type { LocationSnapshot } from "../../domain/fulfillment";

export interface DispatchQuoteResult {
  quotation_id: string;
  price_amount: number;
  price_currency: string;
  service_type: string;
}

export interface BookedDeliveryResult {
  delivery_order_id: number;
  lalamove_order_id: string;
  share_link: string | null;
  price_amount: number;
  price_currency: string;
}

/**
 * Handles Lalamove order lifecycle operations for reservations:
 * - dispatch quote preview
 * - place outbound order on vendor dispatch
 * - place return order on renter return initiation
 */
export class LalamoveOrderService {
  private client(): LalamoveClient {
    return new LalamoveClient();
  }

  /** Returns the vendor fulfillment settings if provider is LALAMOVE, else null. */
  async getLalamoveSettings(vendorId: number): Promise<VendorFulfillmentSettings | null> {
    const settings = await VendorFulfillmentSettings.findOne({ where: { vendor_id: vendorId } });
    if (!settings || settings.delivery_provider !== "LALAMOVE") return null;
    return settings;
  }

  /**
   * Produces a fresh quote for the outbound leg (vendor → renter).
   * Called as the first step of the two-step dispatch flow.
   */
  async quoteOutbound(
    vendorLocation: LocationSnapshot,
    renterLocation: LocationSnapshot,
    serviceType: string
  ): Promise<DispatchQuoteResult> {
    const payload = buildQuotationPayload(vendorLocation, renterLocation, serviceType);
    if (!payload) {
      throw new Error("Cannot get Lalamove quote: vendor or renter location is missing coordinates");
    }

    const client = this.client();
    const quotation = await client.createQuotation(payload);
    return {
      quotation_id: quotation.quotationId,
      price_amount: parseQuotedPrice(quotation.priceBreakdown.total),
      price_currency: quotation.priceBreakdown.currency,
      service_type: quotation.serviceType
    };
  }

  /**
   * Places a Lalamove order for the outbound leg and persists a DeliveryOrder row.
   * A fresh quotation is obtained here (quotationIds expire in 5 minutes).
   */
  async bookOutbound(
    reservationId: number,
    vendorLocation: LocationSnapshot,
    renterLocation: LocationSnapshot,
    serviceType: string,
    checkoutFeeEstimate: number
  ): Promise<BookedDeliveryResult> {
    return this.bookLeg(
      reservationId,
      "OUTBOUND",
      vendorLocation,
      renterLocation,
      serviceType,
      checkoutFeeEstimate
    );
  }

  /**
   * Places a Lalamove order for the return leg (renter → vendor) and persists a DeliveryOrder row.
   */
  async bookReturn(
    reservationId: number,
    renterLocation: LocationSnapshot,
    vendorLocation: LocationSnapshot,
    serviceType: string,
    checkoutFeeEstimate: number
  ): Promise<BookedDeliveryResult> {
    return this.bookLeg(
      reservationId,
      "RETURN",
      renterLocation,
      vendorLocation,
      serviceType,
      checkoutFeeEstimate
    );
  }

  private async bookLeg(
    reservationId: number,
    leg: "OUTBOUND" | "RETURN",
    from: LocationSnapshot,
    to: LocationSnapshot,
    serviceType: string,
    checkoutFeeEstimate: number
  ): Promise<BookedDeliveryResult> {
    const quotePayload = buildQuotationPayload(from, to, serviceType);
    if (!quotePayload) {
      throw new Error(`Cannot book Lalamove ${leg}: missing coordinates on one or both locations`);
    }

    const client = this.client();
    const quotation = await client.createQuotation(quotePayload);

    const senderStop = quotation.stops?.[0] as { stopId?: string } | undefined;
    const recipientStop = quotation.stops?.[1] as { stopId?: string } | undefined;
    const senderStopId = senderStop?.stopId;
    const recipientStopId = recipientStop?.stopId;

    if (!quotation.quotationId || !senderStopId || !recipientStopId) {
      throw new Error(
        `Lalamove ${leg} quotation response was missing quotationId/stopId — check Market header and response unwrapping`
      );
    }

    const senderPhone = from.phone_number?.trim() ?? "";
    const recipientPhone = to.phone_number?.trim() ?? "";
    if (!senderPhone || !recipientPhone) {
      throw new Error(`Cannot book Lalamove ${leg}: sender and recipient phone numbers are required (E.164, e.g. +63917…)`);
    }

    const order = await client.placeOrder({
      quotationId: quotation.quotationId,
      sender: {
        stopId: senderStopId,
        name: from.contact_name?.trim() || "Sender",
        phone: senderPhone
      },
      recipients: [
        {
          stopId: recipientStopId,
          name: to.contact_name?.trim() || "Recipient",
          phone: recipientPhone,
          remarks: to.notes ?? undefined
        }
      ],
      isPODEnabled: true
    });

    const priceAmount = parseQuotedPrice(quotation.priceBreakdown.total);
    const currency = quotation.priceBreakdown.currency;

    const deliveryOrder = await DeliveryOrder.create({
      reservation_id: reservationId,
      leg,
      lalamove_order_id: order.orderId,
      quotation_id: quotation.quotationId,
      service_type: serviceType,
      status: order.status,
      price_amount: priceAmount,
      price_currency: currency,
      share_link: order.shareLink ?? null,
      checkout_fee_estimate: checkoutFeeEstimate
    });

    return {
      delivery_order_id: deliveryOrder.id,
      lalamove_order_id: order.orderId,
      share_link: order.shareLink ?? null,
      price_amount: priceAmount,
      price_currency: currency
    };
  }

  /**
   * Cancels a Lalamove order and updates the DeliveryOrder status.
   * Swallows errors — callers decide what to do if cancel fails.
   */
  async cancelOrder(deliveryOrderId: number): Promise<void> {
    const record = await DeliveryOrder.findByPk(deliveryOrderId);
    if (!record || !record.lalamove_order_id) return;

    try {
      const client = this.client();
      await client.cancelOrder(record.lalamove_order_id);
      await record.update({ status: "CANCELED" });
    } catch (err) {
      await record.update({ status: "CANCEL_FAILED" });
      if (err instanceof LalamoveApiError) {
        console.warn(`[LalamoveOrderService] cancelOrder failed (${err.statusCode}): ${err.lalamoveCode}`);
      }
    }
  }

  /**
   * Returns the most recent DeliveryOrder for a reservation + leg, or null.
   */
  async getDeliveryOrder(reservationId: number, leg: "OUTBOUND" | "RETURN"): Promise<DeliveryOrder | null> {
    return DeliveryOrder.findOne({
      where: { reservation_id: reservationId, leg },
      order: [["created_at", "DESC"]]
    });
  }

  /**
   * Refreshes a DeliveryOrder from Lalamove if it is stale (> staleSecs seconds old).
   * Returns the (possibly updated) record.
   */
  async refreshIfStale(deliveryOrder: DeliveryOrder, staleSecs = 300): Promise<DeliveryOrder> {
    if (!deliveryOrder.lalamove_order_id) return deliveryOrder;

    const ageMs = Date.now() - new Date(deliveryOrder.updated_at).getTime();
    if (ageMs < staleSecs * 1000) return deliveryOrder;

    try {
      const client = this.client();
      const detail = await client.getOrder(deliveryOrder.lalamove_order_id);
      await deliveryOrder.update({
        status: detail.status,
        share_link: detail.shareLink ?? deliveryOrder.share_link,
        driver_name: detail.driverInfo?.name ?? deliveryOrder.driver_name,
        driver_phone: detail.driverInfo?.phone ?? deliveryOrder.driver_phone
      });
    } catch {
      // Return stale data rather than breaking the response
    }

    return deliveryOrder;
  }
}
