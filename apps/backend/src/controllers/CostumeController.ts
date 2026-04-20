import { Request, Response } from "express";
import { CostumeService } from "../services/CostumeService";
import { ReservationService } from "../services/ReservationService";
import {
  ApiResponse,
  CostumeAvailabilityResponse,
  CostumeDetailResponse,
  CostumeListResponse
} from "../dto";

const costumeService = new CostumeService();
const reservationService = new ReservationService();

export class CostumeController {
  async list(req: Request, res: Response) {
    try {
      const result = await costumeService.listFromRequestQuery(req.query);
      ApiResponse.ok(res, result as CostumeListResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const result = await costumeService.getByIdFromParams(req.params);
      ApiResponse.ok(res, result as CostumeDetailResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e, 404);
    }
  }

  async availability(req: Request, res: Response) {
    try {
      const reservations = await reservationService.availabilityForCostumeRoute(req.params, req.query);
      ApiResponse.ok(res, reservations as CostumeAvailabilityResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
