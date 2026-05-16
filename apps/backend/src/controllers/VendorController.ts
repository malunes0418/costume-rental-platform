import { Request, Response } from "express";
import { VendorService } from "../services/VendorService";
import { ApiResponse } from "../dto";
import { VendorApplyRequest, MessageCreateRequest } from "../dto/vendor.dto";

const vendorService = new VendorService();

export class VendorController {
  async apply(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const idDocumentUrl = req.file ? `/uploads/${req.file.filename}` : "";
      if (!idDocumentUrl) throw new Error("ID Document is required");

      const result = await vendorService.apply(userId, req.body as VendorApplyRequest, idDocumentUrl);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await vendorService.getProfile(userId);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listCostumes(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.listCostumes(vendorId);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createCostume(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.createCostume(vendorId, req.body);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateCostume(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.updateCostume(vendorId, Number(req.params.id), req.body);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async publishCostume(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.publishCostume(vendorId, Number(req.params.id));
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async unpublishCostume(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.unpublishCostume(vendorId, Number(req.params.id));
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async deleteCostume(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.deleteCostume(vendorId, Number(req.params.id));
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listReservations(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.listReservations(vendorId);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async approveReservation(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.updateReservationStatus(vendorId, Number(req.params.id), "CONFIRMED");
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async rejectReservation(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.updateReservationStatus(vendorId, Number(req.params.id), "REJECTED_BY_VENDOR");
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listMessages(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await vendorService.listMessages(Number(req.params.id), userId);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await vendorService.createMessage(Number(req.params.id), userId, req.body as MessageCreateRequest);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
