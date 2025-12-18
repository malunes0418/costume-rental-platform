import { Request, Response } from "express";
import { ReservationService } from "../services/ReservationService";

const reservationService = new ReservationService();

export class ReservationController {
  private isValidDateRange(start: Date, end: Date) {
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
  }

  async addToCart(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { costumeId, quantity, startDate, endDate } = req.body;
      if (!costumeId || !quantity || !startDate || !endDate) {
        return res.status(400).json({ message: "costumeId, quantity, startDate, and endDate are required" });
      }
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: "quantity must be a positive integer" });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!this.isValidDateRange(start, end)) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        return res.status(400).json({ message: "startDate cannot be in the past" });
      }
      const result = await reservationService.addToCart(
        user.id,
        Number(costumeId),
        qty,
        start,
        end
      );
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async checkout(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { reservationId } = req.body;
      const id = Number(reservationId);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "reservationId must be a positive integer" });
      }
      const reservation = await reservationService.checkout(user.id, id);
      res.json(reservation);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async myReservations(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const reservations = await reservationService.listUserReservations(user.id);
      res.json(reservations);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
