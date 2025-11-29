import { Request, Response } from "express";
import { ReservationService } from "../services/ReservationService";

const reservationService = new ReservationService();

export class ReservationController {
  async addToCart(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { costumeId, quantity, startDate, endDate } = req.body;
      const result = await reservationService.addToCart(
        user.id,
        Number(costumeId),
        Number(quantity),
        new Date(startDate),
        new Date(endDate)
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
      const reservation = await reservationService.checkout(user.id, Number(reservationId));
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
