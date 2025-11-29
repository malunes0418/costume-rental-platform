import { Request, Response } from "express";
import { NotificationService } from "../services/NotificationService";

const notificationService = new NotificationService();

export class NotificationController {
  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await notificationService.listUserNotifications(user.id);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);
      const notification = await notificationService.markAsRead(user.id, id);
      res.json(notification);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
