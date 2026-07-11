import { Request, Response } from "express";
import { ApiResponse } from "../dto";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  NotificationPreferencesRequest,
  NotificationPreferencesResponse,
  UpdateAvatarResponse,
  UpdateProfileRequest,
  UpdateProfileResponse
} from "../dto/account.dto";
import { AccountService } from "../services/AccountService";
import { platformSettingsService } from "../services/PlatformSettingsService";
import { uploadPublicPath } from "../middleware/uploadMiddleware";

const accountService = new AccountService();

export class AccountController {
  async updateProfile(req: Request, res: Response) {
    try {
      const profile = await accountService.updateProfile(req.user!.id, req.body as UpdateProfileRequest);
      ApiResponse.ok(res, profile as UpdateProfileResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateAvatar(req: Request, res: Response) {
    try {
      if (!req.file) {
        throw new Error("Avatar file is required");
      }

      const avatarUrl = uploadPublicPath(req.file);
      const result = await accountService.updateAvatar(req.user!.id, avatarUrl);
      ApiResponse.ok(res, result as UpdateAvatarResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const result = await accountService.changePassword(req.user!.id, req.body as ChangePasswordRequest);
      ApiResponse.ok(res, result as ChangePasswordResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getNotificationPreferences(req: Request, res: Response) {
    try {
      const preferences = await accountService.getNotificationPreferences(req.user!.id);
      ApiResponse.ok(res, preferences as NotificationPreferencesResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateNotificationPreferences(req: Request, res: Response) {
    try {
      const preferences = await accountService.upsertNotificationPreferences(
        req.user!.id,
        req.body as NotificationPreferencesRequest
      );
      ApiResponse.ok(res, preferences as NotificationPreferencesResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getPlatformSettings(req: Request, res: Response) {
    try {
      const settings = await platformSettingsService.getAll();
      ApiResponse.ok(res, {
        platform_fee_rate: settings.platform_fee_rate
      });
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
