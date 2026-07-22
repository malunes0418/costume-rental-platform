import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/mailer", () => ({
  mailer: {
    sendMail: vi.fn()
  }
}));

vi.mock("../models/Notification", () => ({
  Notification: {
    create: vi.fn(async (row: Record<string, unknown>) => ({ id: 1, ...row }))
  }
}));

vi.mock("../models/User", () => ({
  User: {
    findByPk: vi.fn(async () => ({ id: 9, email: "renter@example.com" })),
    findAll: vi.fn(async () => [{ id: 1, email: "admin@example.com", role: "ADMIN" }])
  }
}));

import { mailer } from "../config/mailer";
import { NotificationService } from "./NotificationService";

describe("NotificationService email resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("still creates an in-app notification when email send fails", async () => {
    vi.mocked(mailer.sendMail).mockRejectedValueOnce(new Error("Invalid login"));

    const service = new NotificationService();
    const notification = await service.create(
      9,
      "RESERVATION_FULFILLMENT_UPDATED",
      "Costume delivered",
      "Your costume for reservation #6 has been delivered."
    );

    expect(notification).toMatchObject({
      user_id: 9,
      title: "Costume delivered"
    });
    expect(mailer.sendMail).toHaveBeenCalledOnce();
  });

  it("createForAdmin continues when one email fails", async () => {
    vi.mocked(mailer.sendMail).mockRejectedValueOnce(new Error("SMTP down"));

    const service = new NotificationService();
    const notifications = await service.createForAdmin(
      "SYSTEM",
      "Admin alert",
      "Something happened"
    );

    expect(notifications).toHaveLength(1);
    expect(mailer.sendMail).toHaveBeenCalledOnce();
  });
});
