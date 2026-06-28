import { Request, Response } from "express";
import { VendorService } from "../services/VendorService";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { ApiResponse } from "../dto";
import type { ReviewPaymentRequest } from "../dto";
import { VendorApplyRequest, MessageCreateRequest, VendorPaymentMethodInput } from "../dto/vendor.dto";

const vendorService = new VendorService();
const paymentService = new PaymentService(new NotificationService());

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

  async reviewPayment(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await paymentService.vendorReview(vendorId, req.body as ReviewPaymentRequest);
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

  async requestReservationSurcharge(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.requestReservationSurcharge(vendorId, Number(req.params.id), req.body);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async dispatchReservation(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.dispatchReservation(
        vendorId,
        Number(req.params.id),
        req.file as Express.Multer.File | undefined
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async confirmVendorReturn(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.confirmVendorReturn(
        vendorId,
        Number(req.params.id),
        req.file as Express.Multer.File | undefined
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async completeReservation(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.completeReservation(vendorId, Number(req.params.id));
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async waiveReservationAdjustment(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const result = await vendorService.waiveReservationAdjustment(
        vendorId,
        Number(req.params.id),
        Number(req.params.adjustmentId)
      );
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

  async getPublicPaymentMethods(req: Request, res: Response) {
    try {
      const vendorId = Number(req.params.vendorId);
      if (!Number.isFinite(vendorId) || vendorId <= 0) {
        throw new Error("Invalid vendor id");
      }
      const result = await vendorService.getPublicPaymentMethods(vendorId);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listPaymentMethods(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await vendorService.listPaymentMethods(userId);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async createPaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const qrImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const result = await vendorService.createPaymentMethod(
        userId,
        req.body as VendorPaymentMethodInput,
        qrImageUrl
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updatePaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const qrImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const result = await vendorService.updatePaymentMethod(
        userId,
        Number(req.params.id),
        req.body as VendorPaymentMethodInput,
        qrImageUrl
      );
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async deletePaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await vendorService.deletePaymentMethod(userId, Number(req.params.id));
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
