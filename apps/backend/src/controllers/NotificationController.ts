import { Request, Response } from "express";
import { NotificationService } from "../services/NotificationService";
import { ApiResponse, ListNotificationsResponse, MarkNotificationReadResponse } from "../dto";

const notificationService = new NotificationService();

export class NotificationController {
  async list(req: Request, res: Response) {
    try {
      const data = await notificationService.listUserNotifications(req.user!.id);
      ApiResponse.ok(res, data as ListNotificationsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const notification = await notificationService.markAsRead(req.user!.id, req.params);
      ApiResponse.ok(res, notification as MarkNotificationReadResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
