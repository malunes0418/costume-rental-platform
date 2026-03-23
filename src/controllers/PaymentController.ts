import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { ApiResponse, MyPaymentsResponse, UploadPaymentProofRequest, UploadPaymentProofResponse } from "../dto";

const notificationService = new NotificationService();
const paymentService = new PaymentService(notificationService);

export class PaymentController {
  async uploadProof(req: Request, res: Response) {
    try {
      const file = req.file as Express.Multer.File | undefined;
      const payment = await paymentService.uploadProof(req.user!.id, req.body as UploadPaymentProofRequest, file);
      ApiResponse.ok(res, payment as UploadPaymentProofResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async myPayments(req: Request, res: Response) {
    try {
      const payments = await paymentService.listForUser(req.user!.id);
      ApiResponse.ok(res, payments as MyPaymentsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
