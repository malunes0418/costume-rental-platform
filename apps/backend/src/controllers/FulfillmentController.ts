import { Request, Response } from "express";
import { ApiResponse } from "../dto";
import type {
  UserSavedLocationListResponse,
  UserSavedLocationRequest,
  UserSavedLocationResponse,
  VendorFulfillmentSettingsRequest,
  VendorFulfillmentSettingsResponse
} from "../dto/fulfillment.dto";
import { FulfillmentService } from "../services/FulfillmentService";

const fulfillmentService = new FulfillmentService();

export class FulfillmentController {
  async getVendorSettings(req: Request, res: Response) {
    try {
      const settings = await fulfillmentService.getVendorSettings(req.user!.id);
      ApiResponse.ok(res, settings as VendorFulfillmentSettingsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async upsertVendorSettings(req: Request, res: Response) {
    try {
      const settings = await fulfillmentService.upsertVendorSettings(
        req.user!.id,
        req.body as VendorFulfillmentSettingsRequest
      );
      ApiResponse.ok(res, settings as VendorFulfillmentSettingsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listSavedLocations(req: Request, res: Response) {
    try {
      const locations = await fulfillmentService.listSavedLocations(req.user!.id);
      ApiResponse.ok(res, locations as UserSavedLocationListResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createSavedLocation(req: Request, res: Response) {
    try {
      const location = await fulfillmentService.createSavedLocation(
        req.user!.id,
        req.body as UserSavedLocationRequest
      );
      ApiResponse.ok(res, location as UserSavedLocationResponse, 201);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateSavedLocation(req: Request, res: Response) {
    try {
      const location = await fulfillmentService.updateSavedLocation(
        req.user!.id,
        Number(req.params.id),
        req.body as UserSavedLocationRequest
      );
      ApiResponse.ok(res, location as UserSavedLocationResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async deleteSavedLocation(req: Request, res: Response) {
    try {
      const result = await fulfillmentService.deleteSavedLocation(req.user!.id, Number(req.params.id));
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
