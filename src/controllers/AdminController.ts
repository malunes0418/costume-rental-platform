import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { AdminService } from "../services/AdminService";
import {
  AdminListInventoryResponse,
  AdminListPaymentsResponse,
  AdminListReservationsResponse,
  AdminListUsersResponse,
  AdminReviewPaymentRequest,
  AdminReviewPaymentResponse,
  ApiResponse
} from "../dto";

const notificationService = new NotificationService();
const paymentService = new PaymentService(notificationService);
const adminService = new AdminService();

export class AdminController {
  async reviewPayment(req: Request, res: Response) {
    try {
      const result = await paymentService.adminReview(req.body as AdminReviewPaymentRequest);
      ApiResponse.ok(res, result as AdminReviewPaymentResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listReservations(req: Request, res: Response) {
    try {
      const reservations = await adminService.listReservations();
      ApiResponse.ok(res, reservations as AdminListReservationsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listPayments(req: Request, res: Response) {
    try {
      const payments = await adminService.listPayments();
      ApiResponse.ok(res, payments as AdminListPaymentsResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listInventory(req: Request, res: Response) {
    try {
      const data = await adminService.listInventory();
      ApiResponse.ok(res, data as AdminListInventoryResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listUsers(req: Request, res: Response) {
    try {
      const users = await adminService.listUsers();
      ApiResponse.ok(res, users as AdminListUsersResponse);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
