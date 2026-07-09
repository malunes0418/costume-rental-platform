import path from "path";
import { Request, Response } from "express";
import { env } from "../config/env";
import { ReservationService } from "../services/ReservationService";
import { VendorService } from "../services/VendorService";
import {
  AddToCartRequest,
  AddToCartResponse,
  AddCostumeToCartRequest,
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
  ConfigureCartReservationRequest,
  MyReservationsResponse,
  RemoveReservationResponse
} from "../dto";

import { LalamoveOrderService } from "../services/lalamove/LalamoveOrderService";
import { ReservationItem } from "../models/ReservationItem";
import { Costume } from "../models/Costume";
import { Reservation } from "../models/Reservation";

const reservationService = new ReservationService();
const vendorService = new VendorService();
const lalamoveOrderService = new LalamoveOrderService();

export class ReservationController {
  async addToCart(req: Request, res: Response) {
    try {
      const result = await reservationService.addToCart(req.user!.id, req.body as AddToCartRequest);
      ApiResponse.ok(res, result as AddToCartResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async addCostumeToCart(req: Request, res: Response) {
    try {
      const result = await reservationService.addCostumeToCart(req.user!.id, req.body as AddCostumeToCartRequest);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async configureCartReservation(req: Request, res: Response) {
    try {
      const result = await reservationService.configureCartReservation(
        req.user!.id,
        Number(req.params.reservationId),
        req.body as ConfigureCartReservationRequest
      );
      ApiResponse.ok(res, result as AddToCartResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async checkout(req: Request, res: Response) {
    try {
      const reservation = await reservationService.checkout(req.user!.id, req.body as CheckoutRequest);
      ApiResponse.ok(res, reservation as CheckoutResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async myReservations(req: Request, res: Response) {
    try {
      const reservations = await reservationService.listUserReservations(req.user!.id);
      ApiResponse.ok(res, reservations as MyReservationsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async removeReservation(req: Request, res: Response) {
    try {
      const result = await reservationService.removeReservation(req.user!.id, Number(req.params.id));
      ApiResponse.ok(res, result as RemoveReservationResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listMessages(req: Request, res: Response) {
    try {
      const result = await vendorService.listMessages(Number(req.params.id), req.user!.id);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e, 403);
    }
  }

  async createMessage(req: Request, res: Response) {
    try {
      const result = await vendorService.createMessage(Number(req.params.id), req.user!.id, req.body);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e, 403);
    }
  }

  async confirmReceived(req: Request, res: Response) {
    try {
      const reservation = await reservationService.confirmReceived(
        req.user!.id,
        Number(req.params.id),
        req.file as Express.Multer.File | undefined
      );
      ApiResponse.ok(res, reservation);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async initiateReturn(req: Request, res: Response) {
    try {
      const reservation = await reservationService.initiateReturn(
        req.user!.id,
        Number(req.params.id),
        req.file as Express.Multer.File | undefined
      );
      ApiResponse.ok(res, reservation);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async cancelReservation(req: Request, res: Response) {
    try {
      const reservation = await reservationService.cancelReservation(req.user!.id, Number(req.params.id));
      ApiResponse.ok(res, reservation);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async handoffProof(req: Request, res: Response) {
    try {
      const proofPath = await reservationService.getHandoffProofFileForViewer(
        req.user!.id,
        Number(req.params.id),
        String(req.params.type)
      );
      res.sendFile(path.basename(proofPath), { root: env.fileUploadDir });
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e, 404);
    }
  }

  /**
   * GET /api/reservations/:id/delivery
   * Returns outbound and return DeliveryOrder records for the reservation.
   * Lazily polls Lalamove if either record is stale (> 5 minutes old).
   * Accessible by the renter or the vendor of the reservation.
   */
  async getDeliveryStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const reservationId = Number(req.params.id);

      // Verify caller is renter or vendor
      const reservation = await Reservation.findByPk(reservationId, {
        include: [
          {
            association: "items",
            include: [{ model: Costume, attributes: ["owner_id"], required: true }],
            required: true
          }
        ]
      });

      if (!reservation) {
        return ApiResponse.fail(res, "Reservation not found", 404);
      }

      const isRenter = Number(reservation.user_id) === Number(userId);
      const items = ((reservation as any).items || []) as Array<{ Costume?: { owner_id: number } }>;
      const isVendor = items.some((item) => Number(item.Costume?.owner_id) === Number(userId));

      if (!isRenter && !isVendor) {
        return ApiResponse.fail(res, "Reservation not found", 404);
      }

      const [outboundRecord, returnRecord] = await Promise.all([
        lalamoveOrderService.getDeliveryOrder(reservationId, "OUTBOUND"),
        lalamoveOrderService.getDeliveryOrder(reservationId, "RETURN")
      ]);

      const [outbound, returnDelivery] = await Promise.all([
        outboundRecord ? lalamoveOrderService.refreshIfStale(outboundRecord) : null,
        returnRecord ? lalamoveOrderService.refreshIfStale(returnRecord) : null
      ]);

      const toDto = (record: typeof outbound) => {
        if (!record) return null;
        return {
          id: record.id,
          leg: record.leg,
          lalamove_order_id: record.lalamove_order_id,
          status: record.status,
          driver_name: record.driver_name,
          driver_phone: record.driver_phone,
          share_link: record.share_link,
          price_amount: Number(record.price_amount),
          price_currency: record.price_currency,
          updated_at: record.updated_at
        };
      };

      ApiResponse.ok(res, {
        outbound: toDto(outbound),
        return: toDto(returnDelivery)
      });
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
