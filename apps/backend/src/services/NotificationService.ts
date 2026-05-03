import type { Request } from "express";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { mailer } from "../config/mailer";

export class NotificationService {
  async create(userId: number, type: string, title: string, message: string) {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message
    });
    const user = await User.findByPk(userId);
    if (user && user.email) {
      await mailer.sendMail({
        to: user.email,
        subject: title,
        text: message
      });
    }
    return notification;
  }

  async createForAdmin(type: string, title: string, message: string) {
    const admins = await User.findAll({ where: { role: "ADMIN" } });
    const notifications = [];
    for (const admin of admins) {
      const n = await Notification.create({
        user_id: admin.id,
        type,
        title,
        message
      });
      notifications.push(n);
      if (admin.email) {
        await mailer.sendMail({
          to: admin.email,
          subject: title,
          text: message
        });
      }
    }
    return notifications;
  }

  async listUserNotifications(userId: number) {
    return Notification.findAll({ where: { user_id: userId }, order: [["created_at", "DESC"]] });
  }

  async markAsRead(userId: number, params: Request["params"]) {
    const notification = await Notification.findOne({ where: { id: Number(params.id), user_id: userId } });
    if (!notification) {
      throw new Error("Notification not found");
    }
    notification.is_read = true;
    await notification.save();
    return notification;
  }

  async markAllAsRead(userId: number) {
    await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
    return { success: true };
  }
}
