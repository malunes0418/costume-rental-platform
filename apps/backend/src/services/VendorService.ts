import { VendorProfile } from "../models/VendorProfile";
import { User } from "../models/User";
import { Costume } from "../models/Costume";
import { Reservation } from "../models/Reservation";
import { Message } from "../models/Message";
import { VendorApplyRequest, CostumeStatusUpdateRequest, MessageCreateRequest } from "../dto/vendor.dto";

export class VendorService {
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
    return Reservation.findAll({
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
    if (reservation.vendor_status !== "PENDING_VENDOR") throw new Error("Reservation is not pending vendor approval");

    reservation.vendor_status = status;
    await reservation.save();
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
