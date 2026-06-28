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

const reservationService = new ReservationService();
const vendorService = new VendorService();

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
}
