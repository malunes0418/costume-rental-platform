import { Op } from "sequelize";
import { MessageCreateRequest, VendorApplyRequest } from "../dto/vendor.dto";
import { Costume, type CostumeCreationAttributes } from "../models/Costume";
import { Message } from "../models/Message";
import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { ReservationItem } from "../models/ReservationItem";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { NotificationService } from "./NotificationService";

type VendorStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
type BlockingReason = "APPLICATION_REQUIRED" | "APPLICATION_UNDER_REVIEW" | "APPLICATION_REJECTED";

type VendorCapabilityResponse = {
  profile: VendorProfile | null;
  status: VendorStatus;
  vendorStatus: VendorStatus;
  canManageDrafts: boolean;
  canPublish: boolean;
  canAcceptReservations: boolean;
  blockingReasons: BlockingReason[];
};

export class VendorService {
  private notificationService = new NotificationService();

  private buildCapabilities(status: VendorStatus): Omit<VendorCapabilityResponse, "profile" | "status" | "vendorStatus"> {
    if (status === "APPROVED") {
      return {
        canManageDrafts: true,
        canPublish: true,
        canAcceptReservations: true,
        blockingReasons: []
      };
    }

    if (status === "PENDING") {
      return {
        canManageDrafts: true,
        canPublish: false,
        canAcceptReservations: false,
        blockingReasons: ["APPLICATION_UNDER_REVIEW"]
      };
    }

    if (status === "REJECTED") {
      return {
        canManageDrafts: false,
        canPublish: false,
        canAcceptReservations: false,
        blockingReasons: ["APPLICATION_REJECTED"]
      };
    }

    return {
      canManageDrafts: false,
      canPublish: false,
      canAcceptReservations: false,
      blockingReasons: ["APPLICATION_REQUIRED"]
    };
  }

  private async findReservationForParticipant(reservationId: number, userId: number) {
    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        {
          association: "items",
          include: [
            {
              model: Costume,
              attributes: ["id", "name", "owner_id"]
            }
          ],
          required: true
        },
        {
          model: User,
          attributes: ["id", "name", "email"]
        }
      ]
    });

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    const ownsItem = (((reservation as any).items || []) as Array<{ Costume?: Costume }>).some(
      (item) => Number(item.Costume?.owner_id) === Number(userId)
    );
    const isRenter = Number(reservation.user_id) === Number(userId);

    if (!ownsItem && !isRenter) {
      throw new Error("Reservation not found or unauthorized");
    }

    return { reservation, ownsItem, isRenter };
  }

  private sanitizeCostumeUpdateInput(data: Record<string, unknown>): Partial<CostumeCreationAttributes> {
    const sanitized: Partial<CostumeCreationAttributes> = {};

    if (typeof data.name === "string") sanitized.name = data.name;
    if (typeof data.description === "string") sanitized.description = data.description;
    if (typeof data.category === "string") sanitized.category = data.category;
    if (typeof data.size === "string") sanitized.size = data.size;
    if (typeof data.gender === "string") sanitized.gender = data.gender;
    if (typeof data.theme === "string") sanitized.theme = data.theme;
    if (data.base_price_per_day !== undefined) sanitized.base_price_per_day = Number(data.base_price_per_day);
    if (data.deposit_amount !== undefined) sanitized.deposit_amount = Number(data.deposit_amount);
    if (data.stock !== undefined) sanitized.stock = Number(data.stock);

    return sanitized;
  }

  private sanitizeCostumeCreateInput(data: Record<string, unknown>): CostumeCreationAttributes {
    const sanitized = this.sanitizeCostumeUpdateInput(data);
    if (!sanitized.name) {
      throw new Error("Costume name is required");
    }
    if (sanitized.base_price_per_day === undefined || Number.isNaN(Number(sanitized.base_price_per_day))) {
      throw new Error("Base price per day is required");
    }

    return {
      ...sanitized,
      name: sanitized.name,
      base_price_per_day: Number(sanitized.base_price_per_day)
    } as CostumeCreationAttributes;
  }

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
      profile.review_note = null;
      profile.reviewed_at = null;
      await profile.save();
    } else {
      profile = await VendorProfile.create({
        user_id: userId,
        business_name: data.business_name,
        bio: data.bio,
        id_document_url: idDocumentUrl,
        review_note: null,
        reviewed_at: null
      });
    }

    user.vendor_status = "PENDING";
    await user.save();

    return this.getProfile(userId);
  }

  async getProfile(userId: number): Promise<VendorCapabilityResponse> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const profile = await VendorProfile.findOne({ where: { user_id: userId } });
    const capabilities = this.buildCapabilities(user.vendor_status as VendorStatus);

    return {
      profile,
      status: user.vendor_status,
      vendorStatus: user.vendor_status,
      ...capabilities
    };
  }

  async listCostumes(vendorId: number) {
    const { CostumeImage } = require("../models/CostumeImage");
    return Costume.findAll({
      where: { owner_id: vendorId, is_active: true },
      include: [{ model: CostumeImage }],
      order: [["created_at", "DESC"]]
    });
  }

  async createCostume(vendorId: number, data: Record<string, unknown>) {
    const { images, ...costumeData } = data;
    const costume = await Costume.create({
      ...this.sanitizeCostumeCreateInput(costumeData),
      owner_id: vendorId,
      status: "DRAFT"
    });

    const { CostumeImage } = require("../models/CostumeImage");
    if (Array.isArray(images)) {
      const imagesToCreate = images.slice(0, 15).map((url: string, index: number) => ({
        costume_id: costume.id,
        image_url: url,
        is_primary: index === 0
      }));
      await CostumeImage.bulkCreate(imagesToCreate);
    }

    return Costume.findByPk(costume.id, { include: [{ model: CostumeImage }] });
  }

  async updateCostume(vendorId: number, costumeId: number, data: Record<string, unknown>) {
    const { images, ...updateData } = data;
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");

    await costume.update(this.sanitizeCostumeUpdateInput(updateData));

    if (Array.isArray(images)) {
      const { CostumeImage } = require("../models/CostumeImage");
      await CostumeImage.destroy({ where: { costume_id: costume.id } });
      const imagesToCreate = images.slice(0, 15).map((url: string, index: number) => ({
        costume_id: costume.id,
        image_url: url,
        is_primary: index === 0
      }));
      await CostumeImage.bulkCreate(imagesToCreate);
    }

    const { CostumeImage } = require("../models/CostumeImage");
    return Costume.findByPk(costume.id, { include: [{ model: CostumeImage }] });
  }

  async publishCostume(vendorId: number, costumeId: number) {
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");
    if (costume.status === "HIDDEN" || costume.status === "FLAGGED") {
      throw new Error("Moderated listings cannot be published by vendors");
    }

    costume.status = "ACTIVE";
    costume.is_active = true;
    await costume.save();
    return costume;
  }

  async unpublishCostume(vendorId: number, costumeId: number) {
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");
    if (costume.status !== "ACTIVE") {
      throw new Error("Only active listings can be unpublished");
    }

    costume.status = "DRAFT";
    await costume.save();
    return costume;
  }

  async deleteCostume(vendorId: number, costumeId: number) {
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");

    const reservationItemCount = await ReservationItem.count({ where: { costume_id: costume.id } });
    if (reservationItemCount > 0) {
      costume.is_active = false;
      await costume.save();
      return {
        message: "Costume archived because it has reservation history.",
        deleted: false,
        archived: true
      };
    }

    await costume.destroy();
    return { message: "Costume deleted.", deleted: true, archived: false };
  }

  async listReservations(vendorId: number) {
    const reservations = await Reservation.findAll({
      include: [
        {
          association: "items",
          include: [
            {
              model: Costume,
              attributes: ["id", "name", "owner_id"],
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

      return {
        ...reservationJson,
        vendor_status:
          reservation.vendor_status === "CONFIRMED" &&
          reservation.status === "PENDING_PAYMENT" &&
          hasPendingReceipt
            ? "PENDING_VENDOR"
            : reservation.vendor_status,
        payments: matchingPayments
      };
    });
  }

  async updateReservationStatus(vendorId: number, reservationId: number, status: "CONFIRMED" | "REJECTED_BY_VENDOR") {
    const { reservation, ownsItem } = await this.findReservationForParticipant(reservationId, vendorId);
    if (!ownsItem) {
      throw new Error("Reservation not found or unauthorized");
    }

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

  async listMessages(reservationId: number, userId: number) {
    await this.findReservationForParticipant(reservationId, userId);
    return Message.findAll({
      where: { reservation_id: reservationId },
      order: [["created_at", "ASC"]]
    });
  }

  async createMessage(reservationId: number, senderId: number, data: MessageCreateRequest) {
    await this.findReservationForParticipant(reservationId, senderId);
    return Message.create({
      reservation_id: reservationId,
      sender_id: senderId,
      content: data.content
    });
  }
}
