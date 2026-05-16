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

  async updateReservationStatus(req: Request, res: Response) {
    try {
      const result = await adminService.updateReservationStatus(Number(req.params.id), req.body.status);
      ApiResponse.ok(res, result);
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

  async updateUserRole(req: Request, res: Response) {
    try {
      const result = await adminService.updateUserRole(Number(req.params.id), req.body.role);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listPendingVendors(req: Request, res: Response) {
    try {
      const users = await adminService.listPendingVendors();
      const mapped = users.map((u: any) => ({
        id: u.VendorProfile?.id || u.id,
        user_id: u.id,
        business_name: u.VendorProfile?.business_name,
        store_name: u.VendorProfile?.business_name, // fallback for UI
        bio: u.VendorProfile?.bio,
        id_document_url: u.VendorProfile?.id_document_url,
        review_note: u.VendorProfile?.review_note,
        reviewed_at: u.VendorProfile?.reviewed_at,
        status: u.vendor_status,
        created_at: u.VendorProfile?.created_at || u.created_at,
        User: {
          name: u.name,
          email: u.email
        }
      }));
      ApiResponse.ok(res, mapped);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async listAllVendors(req: Request, res: Response) {
    try {
      const profiles = await adminService.listAllVendors();
      const mapped = profiles.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        business_name: p.business_name,
        store_name: p.business_name, // fallback for UI
        bio: p.bio,
        id_document_url: p.id_document_url,
        review_note: p.review_note,
        reviewed_at: p.reviewed_at,
        status: p.User?.vendor_status || "NONE",
        created_at: p.created_at,
        User: {
          name: p.User?.name,
          email: p.User?.email
        }
      }));
      ApiResponse.ok(res, mapped);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async approveVendor(req: Request, res: Response) {
    try {
      const result = await adminService.updateVendorStatus(Number(req.params.userId), "APPROVED", req.body.review_note);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async rejectVendor(req: Request, res: Response) {
    try {
      const result = await adminService.updateVendorStatus(Number(req.params.userId), "REJECTED", req.body.review_note);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }

  async updateCostumeStatus(req: Request, res: Response) {
    try {
      const result = await adminService.updateCostumeStatus(Number(req.params.id), req.body.status);
      ApiResponse.ok(res, result);
    } catch (e: unknown) {
      ApiResponse.failFromError(res, e);
    }
  }
}
