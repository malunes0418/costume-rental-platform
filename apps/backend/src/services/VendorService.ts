import { VendorProfile } from "../models/VendorProfile";
import { User } from "../models/User";
import { Costume } from "../models/Costume";
import { Reservation } from "../models/Reservation";
import { Payment } from "../models/Payment";
import { Message } from "../models/Message";
import { VendorApplyRequest, CostumeStatusUpdateRequest, MessageCreateRequest } from "../dto/vendor.dto";
import { Op } from "sequelize";
import { NotificationService } from "./NotificationService";

export class VendorService {
  private notificationService = new NotificationService();

  // --- Vendor Application (KYC) ---
  async apply(userId: number, data: VendorApplyRequest, idDocumentUrl: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    if (user.vendor_status !== "NONE" && user.vendor_status !== "REJECTED") {
      throw new Error("User has already applied or is already a vendor");
    }

    let profile = await VendorProfile.findOne({ where: { user_id: userId } });
    if (profile) {
      profile.business_name = data.business_name || null;
      profile.bio = data.bio || null;
      profile.id_document_url = idDocumentUrl;
      await profile.save();
    } else {
      profile = await VendorProfile.create({
        user_id: userId,
        business_name: data.business_name,
        bio: data.bio,
        id_document_url: idDocumentUrl
      });
    }

    user.vendor_status = "PENDING";
    await user.save();

    return { profile, status: user.vendor_status };
  }

  async getProfile(userId: number) {
    const user = await User.findByPk(userId);
    const profile = await VendorProfile.findOne({ where: { user_id: userId } });
    return { profile, status: user?.vendor_status };
  }

  // --- Vendor Listings ---
  async listCostumes(vendorId: number) {
    const { CostumeImage } = require("../models/CostumeImage");
    return Costume.findAll({ 
      where: { owner_id: vendorId },
      include: [{ model: CostumeImage }]
    });
  }

  async createCostume(vendorId: number, data: any) {
    const { images, ...costumeData } = data;
    const costume = await Costume.create({ ...costumeData, owner_id: vendorId, status: "ACTIVE" });
    
    const { CostumeImage } = require("../models/CostumeImage");
    
    if (images && Array.isArray(images)) {
      const imagesToCreate = images.slice(0, 15).map((url: string, index: number) => ({
        costume_id: costume.id,
        image_url: url,
        is_primary: index === 0
      }));
      await CostumeImage.bulkCreate(imagesToCreate);
    }
    
    return costume;
  }

  async updateCostume(vendorId: number, costumeId: number, data: any) {
    const { images, ...updateData } = data;
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");
    
    await costume.update(updateData);

    if (images && Array.isArray(images)) {
      const { CostumeImage } = require("../models/CostumeImage");
      await CostumeImage.destroy({ where: { costume_id: costume.id } });
      const imagesToCreate = images.slice(0, 15).map((url: string, index: number) => ({
        costume_id: costume.id,
        image_url: url,
        is_primary: index === 0
      }));
      await CostumeImage.bulkCreate(imagesToCreate);
    }

    return costume;
  }

  async deleteCostume(vendorId: number, costumeId: number) {
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");
    await costume.destroy();
    return { message: "Costume deleted" };
  }

  // --- Vendor Reservations ---
  async listReservations(vendorId: number) {
    // A vendor can see reservations for costumes they own
    // This requires a join through ReservationItem and Costume
    const reservations = await Reservation.findAll({
      include: [
        {
          association: "items",
          include: [
            {
              model: Costume,
              attributes: ["id", "name"],
              where: { owner_id: vendorId },
              required: true
            }
          ],
          required: true
        },
        {
          model: User,
          attributes: ["id", "name", "email"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    const userIds = [...new Set(reservations.map((reservation) => Number(reservation.user_id)).filter(Boolean))];
    const payments = userIds.length
      ? await Payment.findAll({
          where: { user_id: { [Op.in]: userIds } },
          order: [["created_at", "DESC"]]
        })
      : [];

    return reservations.map((reservation) => {
      const reservationJson = reservation.toJSON();
      const matchingPayments = payments
        .filter((payment) =>
          Array.isArray(payment.reservation_ids) &&
          payment.reservation_ids.some((paymentReservationId) => Number(paymentReservationId) === Number(reservation.id))
        )
        .map((payment) => payment.toJSON());

      const hasPendingReceipt = matchingPayments.some(
        (payment) => payment.status === "PENDING" && Boolean(payment.proof_url)
      );
      const effectiveVendorStatus =
        reservation.vendor_status === "CONFIRMED" &&
        reservation.status === "PENDING_PAYMENT" &&
        hasPendingReceipt
          ? "PENDING_VENDOR"
          : reservation.vendor_status;

      return {
        ...reservationJson,
        vendor_status: effectiveVendorStatus,
        payments: matchingPayments
      };
    });
  }

  async updateReservationStatus(vendorId: number, reservationId: number, status: "CONFIRMED" | "REJECTED_BY_VENDOR") {
    // Verify the reservation belongs to the vendor
    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        {
          association: "items",
          include: [
            {
              model: Costume,
              where: { owner_id: vendorId },
              required: true
            }
          ],
          required: true
        }
      ]
    });
    if (!reservation) throw new Error("Reservation not found or unauthorized");

    const matchingPayments = await Payment.findAll({
      where: { user_id: reservation.user_id, status: "PENDING" },
      order: [["created_at", "DESC"]]
    });
    const hasPendingReceipt = matchingPayments.some(
      (payment) =>
        Array.isArray(payment.reservation_ids) &&
        payment.reservation_ids.some((paymentReservationId) => Number(paymentReservationId) === Number(reservation.id)) &&
        Boolean(payment.proof_url)
    );

    const isPendingVendorReview =
      reservation.vendor_status === "PENDING_VENDOR" ||
      (reservation.vendor_status === "CONFIRMED" &&
        reservation.status === "PENDING_PAYMENT" &&
        hasPendingReceipt);

    if (!isPendingVendorReview) throw new Error("Reservation is not pending vendor approval");

    reservation.vendor_status = status;
    reservation.status = status === "CONFIRMED" ? "PAID" : "CANCELLED";
    await reservation.save();

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_VENDOR_REVIEW",
      status === "CONFIRMED" ? "Reservation approved" : "Reservation declined",
      status === "CONFIRMED"
        ? `Your payment receipt was reviewed and reservation #${reservation.id} has been approved by the vendor.`
        : `Your payment receipt was reviewed and reservation #${reservation.id} was declined by the vendor.`
    );

    return reservation;
  }

  // --- Messages ---
  async listMessages(reservationId: number, userId: number) {
    // Add verification that userId is either the renter or the vendor
    return Message.findAll({
      where: { reservation_id: reservationId },
      order: [["created_at", "ASC"]]
    });
  }

  async createMessage(reservationId: number, senderId: number, data: MessageCreateRequest) {
    // Add verification that senderId is either the renter or the vendor
    return Message.create({
      reservation_id: reservationId,
      sender_id: senderId,
      content: data.content
    });
  }
}
