import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { Payment } from "../models/Payment";

const notificationService = new NotificationService();
const paymentService = new PaymentService(notificationService);

export class PaymentController {
  async uploadProof(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { reservationId, amount } = req.body;
      const file = (req as any).file as Express.Multer.File;
      if (!file) {
        res.status(400).json({ message: "Proof file is required" });
        return;
      }
      const payment = await paymentService.uploadProof(user.id, Number(reservationId), `/uploads/${file.filename}`, Number(amount));
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async myPayments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const payments = await Payment.findAll({ where: { user_id: user.id } });
      res.json(payments);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
