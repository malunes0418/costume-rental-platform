import { Op } from "sequelize";
import {
  MessageCreateRequest,
  VendorApplyRequest,
  VendorReservationSurchargeRequest
} from "../dto/vendor.dto";
import type { CostumeFulfillmentOverrideRequest } from "../dto/fulfillment.dto";
import {
  assertReservationTransition,
  deriveVendorReservationStatus,
  type ReservationStatus
} from "../domain/reservationLifecycle";
import { presentFulfillmentHandoffProofs } from "../domain/handoffProofs";
import type { ReservationFulfillmentApprovalStatus } from "../domain/fulfillment";
import { Costume, type CostumeCreationAttributes } from "../models/Costume";
import { Message } from "../models/Message";
import { Payment } from "../models/Payment";
import { Reservation } from "../models/Reservation";
import { ReservationAdjustment } from "../models/ReservationAdjustment";
import { ReservationFulfillment } from "../models/ReservationFulfillment";
import { ReservationItem } from "../models/ReservationItem";
import { User } from "../models/User";
import { VendorProfile } from "../models/VendorProfile";
import { NotificationService } from "./NotificationService";
import {
  normalizeCostumePricingConfig,
  type CostumePricingConfigInput,
  type PricingMode
} from "../utils/pricing";
import { FulfillmentService } from "./FulfillmentService";
import { HandoffService } from "./HandoffService";
import { assertInitialPaymentApprovedForVendorReview } from "./reservationPaymentGuards";

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
  private fulfillmentService = new FulfillmentService();
  private handoffService = new HandoffService();

  private async hydrateReservationForVendor(vendorId: number, reservationId: number) {
    const reservations = await this.listReservations(vendorId);
    return reservations.find((reservation) => Number((reservation as any).id) === Number(reservationId)) || null;
  }

  private async updateFulfillmentApproval(
    reservationId: number,
    status: ReservationFulfillmentApprovalStatus,
    note?: string | null,
    markOutsideServiceArea?: boolean
  ) {
    const fulfillment = await ReservationFulfillment.findOne({ where: { reservation_id: reservationId } });
    if (!fulfillment) {
      return null;
    }

    fulfillment.vendor_approval_status = status;
    fulfillment.vendor_approval_note = note ?? null;
    if (markOutsideServiceArea !== undefined) {
      fulfillment.outside_service_area = markOutsideServiceArea;
    }
    await fulfillment.save();
    return fulfillment;
  }

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
        },
        { association: "fulfillment" },
        { association: "adjustments" }
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
    const nullableNumber = (value: unknown) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return Number(value);
    };

    if (typeof data.name === "string") sanitized.name = data.name;
    if (typeof data.description === "string") sanitized.description = data.description;
    if (typeof data.category === "string") sanitized.category = data.category;
    if (typeof data.size === "string") sanitized.size = data.size;
    if (typeof data.gender === "string") sanitized.gender = data.gender;
    if (typeof data.theme === "string") sanitized.theme = data.theme;
    if (typeof data.pricing_mode === "string") sanitized.pricing_mode = data.pricing_mode as PricingMode;
    if (data.base_price_per_day !== undefined) sanitized.base_price_per_day = nullableNumber(data.base_price_per_day);
    if (data.package_price !== undefined) sanitized.package_price = nullableNumber(data.package_price);
    if (data.package_included_days !== undefined) sanitized.package_included_days = nullableNumber(data.package_included_days);
    if (data.package_unused_day_discount !== undefined) {
      sanitized.package_unused_day_discount = nullableNumber(data.package_unused_day_discount);
    }
    if (data.package_extra_day_charge !== undefined) {
      sanitized.package_extra_day_charge = nullableNumber(data.package_extra_day_charge);
    }
    if (data.deposit_amount !== undefined) sanitized.deposit_amount = Number(data.deposit_amount);
    if (data.stock !== undefined) sanitized.stock = Number(data.stock);

    return sanitized;
  }

  private normalizePricingFields(
    input: Partial<CostumeCreationAttributes>,
    current?: Pick<
      CostumeCreationAttributes,
      | "pricing_mode"
      | "base_price_per_day"
      | "package_price"
      | "package_included_days"
      | "package_unused_day_discount"
      | "package_extra_day_charge"
    >
  ) {
    const merged: CostumePricingConfigInput = {
      pricing_mode: (input.pricing_mode ?? current?.pricing_mode ?? "PER_DAY") as PricingMode,
      base_price_per_day: input.base_price_per_day ?? current?.base_price_per_day ?? null,
      package_price: input.package_price ?? current?.package_price ?? null,
      package_included_days: input.package_included_days ?? current?.package_included_days ?? null,
      package_unused_day_discount: input.package_unused_day_discount ?? current?.package_unused_day_discount ?? null,
      package_extra_day_charge: input.package_extra_day_charge ?? current?.package_extra_day_charge ?? null
    };

    return normalizeCostumePricingConfig(merged);
  }

  private sanitizeCostumeCreateInput(data: Record<string, unknown>): CostumeCreationAttributes {
    const sanitized = this.sanitizeCostumeUpdateInput(data);
    if (!sanitized.name) {
      throw new Error("Costume name is required");
    }

    const pricing = this.normalizePricingFields(sanitized);

    return {
      ...sanitized,
      name: sanitized.name,
      ...pricing
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
      include: [{ model: CostumeImage }, { association: "fulfillmentOverride" }],
      order: [["created_at", "DESC"]]
    });
  }

  async createCostume(vendorId: number, data: Record<string, unknown>) {
    const { images, fulfillment_override, ...costumeData } = data;
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

    await this.fulfillmentService.upsertCostumeOverride(
      vendorId,
      costume.id,
      fulfillment_override as CostumeFulfillmentOverrideRequest | null | undefined
    );

    return Costume.findByPk(costume.id, { include: [{ model: CostumeImage }, { association: "fulfillmentOverride" }] });
  }

  async updateCostume(vendorId: number, costumeId: number, data: Record<string, unknown>) {
    const { images, fulfillment_override, ...updateData } = data;
    const costume = await Costume.findOne({ where: { id: costumeId, owner_id: vendorId } });
    if (!costume) throw new Error("Costume not found or unauthorized");

    const sanitized = this.sanitizeCostumeUpdateInput(updateData);
    const normalizedPricing = this.normalizePricingFields(sanitized, {
      pricing_mode: costume.pricing_mode,
      base_price_per_day: costume.base_price_per_day,
      package_price: costume.package_price,
      package_included_days: costume.package_included_days,
      package_unused_day_discount: costume.package_unused_day_discount,
      package_extra_day_charge: costume.package_extra_day_charge
    });

    await costume.update({ ...sanitized, ...normalizedPricing });

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

    await this.fulfillmentService.upsertCostumeOverride(
      vendorId,
      costume.id,
      fulfillment_override as CostumeFulfillmentOverrideRequest | null | undefined
    );

    const { CostumeImage } = require("../models/CostumeImage");
    return Costume.findByPk(costume.id, { include: [{ model: CostumeImage }, { association: "fulfillmentOverride" }] });
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
      where: { status: { [Op.ne]: "CART" } },
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
        },
        { association: "fulfillment" },
        { association: "adjustments" }
      ],
      order: [["created_at", "DESC"]]
    });

    const userIds = [...new Set(reservations.map((reservation) => Number(reservation.user_id)).filter(Boolean))];
    const payments = userIds.length
      ? await Payment.findAll({
          where: { user_id: { [Op.in]: userIds } },
          include: [{ association: "reservationAdjustment", required: false }],
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
        .map((payment) => ({
          ...payment.toJSON(),
          proof_url: payment.proof_url ? `/api/payments/${payment.id}/proof` : null
        }));

      return {
        ...reservationJson,
        fulfillment: presentFulfillmentHandoffProofs(reservation.id, reservationJson.fulfillment),
        payments: matchingPayments
      };
    });
  }

  async updateReservationStatus(vendorId: number, reservationId: number, status: "CONFIRMED" | "REJECTED_BY_VENDOR") {
    const { reservation, ownsItem } = await this.findReservationForParticipant(reservationId, vendorId);
    if (!ownsItem) {
      throw new Error("Reservation not found or unauthorized");
    }

    assertReservationTransition(reservation.status, status, "Reservation");
    await assertInitialPaymentApprovedForVendorReview(reservation);

    reservation.status = status;
    reservation.vendor_status = deriveVendorReservationStatus(status, reservation.vendor_status);
    await reservation.save();

    await this.updateFulfillmentApproval(
      reservation.id,
      status === "CONFIRMED" ? "APPROVED" : "REJECTED",
      status === "REJECTED_BY_VENDOR" ? "Vendor declined the fulfillment request." : null
    );

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_VENDOR_REVIEW",
      status === "CONFIRMED" ? "Reservation approved" : "Reservation declined",
      status === "CONFIRMED"
        ? `Your fulfillment request for reservation #${reservation.id} has been approved by the vendor.`
        : `Your fulfillment request for reservation #${reservation.id} was declined by the vendor.`
    );

    return (await this.hydrateReservationForVendor(vendorId, reservation.id)) || reservation;
  }

  async requestReservationSurcharge(
    vendorId: number,
    reservationId: number,
    payload: VendorReservationSurchargeRequest
  ) {
    const { reservation, ownsItem } = await this.findReservationForParticipant(reservationId, vendorId);
    if (!ownsItem) {
      throw new Error("Reservation not found or unauthorized");
    }

    assertReservationTransition(reservation.status, "AWAITING_SURCHARGE_PAYMENT", "Reservation");
    await assertInitialPaymentApprovedForVendorReview(reservation);

    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Surcharge amount must be a valid positive number");
    }

    const note = payload.note?.trim();
    if (!note) {
      throw new Error("Please include a note explaining the surcharge request");
    }

    const fulfillment = await ReservationFulfillment.findOne({ where: { reservation_id: reservation.id } });
    if (!fulfillment) {
      throw new Error("Reservation fulfillment details are missing");
    }
    if (fulfillment.outbound_method !== "DELIVERY" && fulfillment.return_method !== "DELIVERY") {
      throw new Error("Outside-area surcharges can only be requested for delivery reservations");
    }

    const existingPendingAdjustment = await ReservationAdjustment.findOne({
      where: {
        reservation_id: reservation.id,
        status: "PENDING"
      }
    });
    if (existingPendingAdjustment) {
      throw new Error("This reservation already has a pending surcharge request");
    }

    await ReservationAdjustment.create({
      reservation_id: reservation.id,
      type: "OUTSIDE_AREA_SURCHARGE",
      amount,
      status: "PENDING",
      note,
      created_by_user_id: vendorId
    });

    reservation.status = "AWAITING_SURCHARGE_PAYMENT";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    await this.updateFulfillmentApproval(reservation.id, "APPROVED", note, true);

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_SURCHARGE_REQUESTED",
      "Supplemental payment requested",
      `The vendor reviewed reservation #${reservation.id} and requested an outside-area surcharge of PHP ${amount.toLocaleString()}. Upload a supplemental payment receipt to continue the booking.`
    );

    return (await this.hydrateReservationForVendor(vendorId, reservation.id)) || reservation;
  }

  async dispatchReservation(vendorId: number, reservationId: number, file?: Express.Multer.File) {
    await this.handoffService.dispatchReservation(vendorId, reservationId, file);
    return (await this.hydrateReservationForVendor(vendorId, reservationId)) || null;
  }

  async confirmVendorReturn(vendorId: number, reservationId: number, file?: Express.Multer.File) {
    await this.handoffService.confirmVendorReturn(vendorId, reservationId, file);
    return (await this.hydrateReservationForVendor(vendorId, reservationId)) || null;
  }

  async completeReservation(vendorId: number, reservationId: number) {
    await this.handoffService.completeReservation(vendorId, reservationId);
    return (await this.hydrateReservationForVendor(vendorId, reservationId)) || null;
  }

  async waiveReservationAdjustment(vendorId: number, reservationId: number, adjustmentId: number) {
    const { reservation, ownsItem } = await this.findReservationForParticipant(reservationId, vendorId);
    if (!ownsItem) {
      throw new Error("Reservation not found or unauthorized");
    }

    if (reservation.status !== "AWAITING_SURCHARGE_PAYMENT") {
      throw new Error("Surcharge adjustments can only be waived while awaiting surcharge payment");
    }

    const adjustment = await ReservationAdjustment.findOne({
      where: {
        id: adjustmentId,
        reservation_id: reservation.id,
        status: "PENDING"
      }
    });
    if (!adjustment) {
      throw new Error("Pending surcharge adjustment not found");
    }

    adjustment.status = "WAIVED";
    await adjustment.save();

    assertReservationTransition(reservation.status, "CONFIRMED", "Reservation");
    reservation.status = "CONFIRMED";
    reservation.vendor_status = deriveVendorReservationStatus(reservation.status, reservation.vendor_status);
    await reservation.save();

    await this.notificationService.create(
      reservation.user_id,
      "RESERVATION_SURCHARGE_WAIVED",
      "Surcharge waived",
      `The vendor waived the outside-area surcharge for reservation #${reservation.id}. Your booking is now confirmed.`
    );

    return (await this.hydrateReservationForVendor(vendorId, reservation.id)) || reservation;
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
