import bcrypt from "bcryptjs";
import type {
  ChangePasswordRequest,
  NotificationPreferencesRequest,
  NotificationPreferencesResponse,
  UpdateAvatarResponse,
  UpdateProfileRequest,
  UpdateProfileResponse
} from "../dto/account.dto";
import { User } from "../models/User";
import { UserNotificationPreferences } from "../models/UserNotificationPreferences";
import { assertPasswordPolicy } from "../utils/passwordPolicy";

const DEFAULT_NOTIFICATION_PREFS = {
  reservations_email: true,
  reservations_push: true,
  payments_email: true,
  payments_push: true,
  messages_email: true,
  messages_push: true,
  marketing_email: false,
  marketing_push: false
};

export class AccountService {
  private toProfileResponse(user: User): UpdateProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url
    };
  }

  private toNotificationPreferencesResponse(
    prefs: UserNotificationPreferences
  ): NotificationPreferencesResponse {
    return {
      user_id: prefs.user_id,
      reservations_email: prefs.reservations_email,
      reservations_push: prefs.reservations_push,
      payments_email: prefs.payments_email,
      payments_push: prefs.payments_push,
      messages_email: prefs.messages_email,
      messages_push: prefs.messages_push,
      marketing_email: prefs.marketing_email,
      marketing_push: prefs.marketing_push,
      created_at: prefs.created_at,
      updated_at: prefs.updated_at
    };
  }

  private emptyNotificationPreferences(userId: number): NotificationPreferencesResponse {
    return {
      user_id: userId,
      ...DEFAULT_NOTIFICATION_PREFS
    };
  }

  async updateProfile(userId: number, payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: Partial<{ name: string | null; email: string }> = {};

    if (payload.name !== undefined) {
      const name = payload.name.trim();
      if (!name) {
        throw new Error("Name cannot be empty");
      }
      updates.name = name;
    }

    if (payload.email !== undefined) {
      const email = payload.email.trim().toLowerCase();
      if (!email) {
        throw new Error("Email cannot be empty");
      }

      if (email !== user.email) {
        if (!user.password_hash) {
          throw new Error(
            "OAuth accounts cannot change email here. Link a password first or contact support."
          );
        }
        if (!payload.current_password) {
          throw new Error("Current password is required to change email");
        }
        const match = await bcrypt.compare(payload.current_password, user.password_hash);
        if (!match) {
          throw new Error("Current password is incorrect");
        }

        const existing = await User.findOne({ where: { email } });
        if (existing && existing.id !== userId) {
          throw new Error("Email already in use");
        }
        updates.email = email;
      }
    }

    if (Object.keys(updates).length === 0) {
      return this.toProfileResponse(user);
    }

    await user.update(updates);
    return this.toProfileResponse(user);
  }

  async changePassword(userId: number, payload: ChangePasswordRequest): Promise<{ success: true }> {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newPassword = payload.new_password?.trim();
    assertPasswordPolicy(newPassword || "", "New password");

    if (user.password_hash) {
      if (!payload.current_password) {
        throw new Error("Current password is required");
      }
      const match = await bcrypt.compare(payload.current_password, user.password_hash);
      if (!match) {
        throw new Error("Current password is incorrect");
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hash });
    return { success: true };
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<UpdateAvatarResponse> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await user.update({ avatar_url: avatarUrl });
    return { avatar_url: avatarUrl };
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreferencesResponse> {
    const prefs = await UserNotificationPreferences.findOne({ where: { user_id: userId } });
    if (!prefs) {
      return this.emptyNotificationPreferences(userId);
    }

    return this.toNotificationPreferencesResponse(prefs);
  }

  async upsertNotificationPreferences(
    userId: number,
    payload: NotificationPreferencesRequest
  ): Promise<NotificationPreferencesResponse> {
    const existing = await UserNotificationPreferences.findOne({ where: { user_id: userId } });

    const nextValues = {
      reservations_email:
        payload.reservations_email ?? existing?.reservations_email ?? DEFAULT_NOTIFICATION_PREFS.reservations_email,
      reservations_push:
        payload.reservations_push ?? existing?.reservations_push ?? DEFAULT_NOTIFICATION_PREFS.reservations_push,
      payments_email:
        payload.payments_email ?? existing?.payments_email ?? DEFAULT_NOTIFICATION_PREFS.payments_email,
      payments_push:
        payload.payments_push ?? existing?.payments_push ?? DEFAULT_NOTIFICATION_PREFS.payments_push,
      messages_email:
        payload.messages_email ?? existing?.messages_email ?? DEFAULT_NOTIFICATION_PREFS.messages_email,
      messages_push:
        payload.messages_push ?? existing?.messages_push ?? DEFAULT_NOTIFICATION_PREFS.messages_push,
      marketing_email:
        payload.marketing_email ?? existing?.marketing_email ?? DEFAULT_NOTIFICATION_PREFS.marketing_email,
      marketing_push:
        payload.marketing_push ?? existing?.marketing_push ?? DEFAULT_NOTIFICATION_PREFS.marketing_push
    };

    if (existing) {
      await existing.update(nextValues);
      return this.toNotificationPreferencesResponse(existing);
    }

    const created = await UserNotificationPreferences.create({
      user_id: userId,
      ...nextValues
    });
    return this.toNotificationPreferencesResponse(created);
  }
}
