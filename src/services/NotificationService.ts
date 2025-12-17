import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { mailer } from "../config/mailer";

export class NotificationService {
  private sanitizeEmailHeader(text: string): string {
    // Remove newlines and carriage returns to prevent email header injection
    return text.replace(/[\r\n]/g, '');
  }

  async create(userId: number, type: string, title: string, message: string) {
    const sanitizedTitle = this.sanitizeEmailHeader(title);
    
    const notification = await Notification.create({
      user_id: userId,
      type,
      title: sanitizedTitle,
      message
    });
    const user = await User.findByPk(userId);
    if (user && user.email) {
      await mailer.sendMail({
        to: this.sanitizeEmailHeader(user.email),
        subject: sanitizedTitle,
        text: message
      });
    }
    return notification;
  }

  async createForAdmin(type: string, title: string, message: string) {
    const sanitizedTitle = this.sanitizeEmailHeader(title);
    
    const admins = await User.findAll({ where: { role: "ADMIN" } });
    const notifications = [];
    for (const admin of admins) {
      const n = await Notification.create({
        user_id: admin.id,
        type,
        title: sanitizedTitle,
        message
      });
      notifications.push(n);
      if (admin.email) {
        await mailer.sendMail({
          to: this.sanitizeEmailHeader(admin.email),
          subject: sanitizedTitle,
          text: message
        });
      }
    }
    return notifications;
  }

  async listUserNotifications(userId: number) {
    return Notification.findAll({ where: { user_id: userId }, order: [["created_at", "DESC"]] });
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await Notification.findOne({ where: { id: notificationId, user_id: userId } });
    if (!notification) {
      throw new Error("Notification not found");
    }
    notification.is_read = true;
    await notification.save();
    return notification;
  }
}
