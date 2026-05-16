import { Request, Response } from "express";
import { ReservationService } from "../services/ReservationService";
import { VendorService } from "../services/VendorService";
import {
  AddToCartRequest,
  AddToCartResponse,
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
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
}
