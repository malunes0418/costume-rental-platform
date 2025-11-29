import { Request, Response } from "express";
import { CostumeService } from "../services/CostumeService";
import { ReservationService } from "../services/ReservationService";

const costumeService = new CostumeService();
const reservationService = new ReservationService();

export class CostumeController {
  async list(req: Request, res: Response) {
    try {
      const { q, category, size, gender, theme, sort } = req.query;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
      const result = await costumeService.list({
        q: q as string | undefined,
        category: category as string | undefined,
        size: size as string | undefined,
        gender: gender as string | undefined,
        theme: theme as string | undefined,
        sort: sort as string | undefined,
        page,
        pageSize
      });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await costumeService.getById(id);
      res.json(result);
    } catch (e: any) {
      res.status(404).json({ message: e.message });
    }
  }

  async availability(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({ message: "startDate and endDate are required" });
        return;
      }
      const reservations = await reservationService.getAvailability(id, new Date(startDate as string), new Date(endDate as string));
      res.json(reservations);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
