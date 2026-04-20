import { Request, Response } from "express";
import { ReservationService } from "../services/ReservationService";
import {
  AddToCartRequest,
  AddToCartResponse,
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
  MyReservationsResponse
} from "../dto";

const reservationService = new ReservationService();

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
}
