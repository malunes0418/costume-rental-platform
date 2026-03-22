import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { AdminService } from "../services/AdminService";

const notificationService = new NotificationService();
const paymentService = new PaymentService(notificationService);
const adminService = new AdminService();

export class AdminController {
  async reviewPayment(req: Request, res: Response) {
    try {
      const { paymentId, approve, notes } = req.body;
      const result = await paymentService.adminReview(Number(paymentId), Boolean(approve), notes);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async listReservations(req: Request, res: Response) {
    try {
      const reservations = await adminService.listReservations();
      res.json(reservations);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async listPayments(req: Request, res: Response) {
    try {
      const payments = await adminService.listPayments();
      res.json(payments);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async listInventory(req: Request, res: Response) {
    try {
      const data = await adminService.listInventory();
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async listUsers(req: Request, res: Response) {
    try {
      const users = await adminService.listUsers();
      res.json(users);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
