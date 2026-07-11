import { sequelize } from "../config/db";
import { User } from "./User";
import { OAuthAccount } from "./OAuthAccount";
import { Costume } from "./Costume";
import { CostumeImage } from "./CostumeImage";
import { Inventory } from "./Inventory";
import { Reservation } from "./Reservation";
import { ReservationItem } from "./ReservationItem";
import { Payment } from "./Payment";
import { Notification } from "./Notification";
import { WishlistItem } from "./WishlistItem";
import { Review } from "./Review";
import { VendorProfile } from "./VendorProfile";
import { Message } from "./Message";
import { Subscription } from "./Subscription";
import { VendorFulfillmentSettings } from "./VendorFulfillmentSettings";
import { CostumeFulfillmentOverride } from "./CostumeFulfillmentOverride";
import { UserSavedLocation } from "./UserSavedLocation";
import { UserFulfillmentPreferences } from "./UserFulfillmentPreferences";
import { UserNotificationPreferences } from "./UserNotificationPreferences";
import { ReservationFulfillment } from "./ReservationFulfillment";
import { ReservationAdjustment } from "./ReservationAdjustment";
import { VendorPaymentMethod } from "./VendorPaymentMethod";
import { DeliveryOrder } from "./DeliveryOrder";
import { AdminAuditLog } from "./AdminAuditLog";
import { ContentReport } from "./ContentReport";
import { Dispute } from "./Dispute";
import { DisputeMessage } from "./DisputeMessage";
import { VendorEarningEntry } from "./VendorEarningEntry";
import { VendorPayout } from "./VendorPayout";
import { PlatformSetting } from "./PlatformSetting";

Reservation.hasMany(DeliveryOrder, { foreignKey: "reservation_id", as: "deliveryOrders" });
DeliveryOrder.belongsTo(Reservation, { foreignKey: "reservation_id" });

User.hasMany(AdminAuditLog, { foreignKey: "actor_id", as: "adminAuditLogs" });
AdminAuditLog.belongsTo(User, { foreignKey: "actor_id", as: "actor" });

User.hasMany(ContentReport, { foreignKey: "reporter_id", as: "contentReports" });
ContentReport.belongsTo(User, { foreignKey: "reporter_id", as: "reporter" });
User.hasMany(ContentReport, { foreignKey: "resolved_by", as: "resolvedContentReports" });
ContentReport.belongsTo(User, { foreignKey: "resolved_by", as: "resolver" });

Reservation.hasMany(Dispute, { foreignKey: "reservation_id", as: "disputes" });
Dispute.belongsTo(Reservation, { foreignKey: "reservation_id", as: "reservation" });
User.hasMany(Dispute, { foreignKey: "opened_by", as: "openedDisputes" });
Dispute.belongsTo(User, { foreignKey: "opened_by", as: "opener" });
User.hasMany(Dispute, { foreignKey: "against_user_id", as: "disputesAgainst" });
Dispute.belongsTo(User, { foreignKey: "against_user_id", as: "againstUser" });
Dispute.hasMany(DisputeMessage, { foreignKey: "dispute_id", as: "messages" });
DisputeMessage.belongsTo(Dispute, { foreignKey: "dispute_id", as: "dispute" });
User.hasMany(DisputeMessage, { foreignKey: "author_id", as: "disputeMessages" });
DisputeMessage.belongsTo(User, { foreignKey: "author_id", as: "author" });

User.hasMany(VendorEarningEntry, { foreignKey: "vendor_id", as: "earningEntries" });
VendorEarningEntry.belongsTo(User, { foreignKey: "vendor_id", as: "vendor" });
Reservation.hasMany(VendorEarningEntry, { foreignKey: "reservation_id", as: "earningEntries" });
VendorEarningEntry.belongsTo(Reservation, { foreignKey: "reservation_id", as: "reservation" });
VendorPayout.hasMany(VendorEarningEntry, { foreignKey: "payout_id", as: "entries" });
VendorEarningEntry.belongsTo(VendorPayout, { foreignKey: "payout_id", as: "payout" });

User.hasMany(VendorPayout, { foreignKey: "vendor_id", as: "payouts" });
VendorPayout.belongsTo(User, { foreignKey: "vendor_id", as: "vendor" });
User.hasMany(VendorPayout, { foreignKey: "created_by", as: "createdPayouts" });
VendorPayout.belongsTo(User, { foreignKey: "created_by", as: "creator" });

User.hasMany(PlatformSetting, { foreignKey: "updated_by", as: "updatedSettings" });
PlatformSetting.belongsTo(User, { foreignKey: "updated_by", as: "updater" });

User.hasMany(OAuthAccount, { foreignKey: "user_id" });
OAuthAccount.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(VendorProfile, { foreignKey: "user_id" });
VendorProfile.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(VendorPaymentMethod, { foreignKey: "user_id", as: "paymentMethods" });
VendorPaymentMethod.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(Subscription, { foreignKey: "user_id" });
Subscription.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(VendorFulfillmentSettings, { foreignKey: "vendor_id", as: "fulfillmentSettings" });
VendorFulfillmentSettings.belongsTo(User, { foreignKey: "vendor_id", as: "vendor" });

User.hasMany(UserSavedLocation, { foreignKey: "user_id", as: "savedLocations" });
UserSavedLocation.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(UserFulfillmentPreferences, { foreignKey: "user_id", as: "fulfillmentPreferences" });
UserFulfillmentPreferences.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(UserNotificationPreferences, { foreignKey: "user_id", as: "notificationPreferences" });
UserNotificationPreferences.belongsTo(User, { foreignKey: "user_id" });

UserSavedLocation.hasMany(UserFulfillmentPreferences, {
  foreignKey: "default_saved_location_id",
  as: "defaultForPreferences"
});
UserFulfillmentPreferences.belongsTo(UserSavedLocation, {
  foreignKey: "default_saved_location_id",
  as: "defaultSavedLocation"
});

User.hasMany(Costume, { foreignKey: "owner_id", as: "costumes" });
Costume.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

Costume.hasMany(CostumeImage, { foreignKey: "costume_id" });
CostumeImage.belongsTo(Costume, { foreignKey: "costume_id" });

Costume.hasOne(CostumeFulfillmentOverride, { foreignKey: "costume_id", as: "fulfillmentOverride" });
CostumeFulfillmentOverride.belongsTo(Costume, { foreignKey: "costume_id" });

User.hasMany(Reservation, { foreignKey: "user_id" });
Reservation.belongsTo(User, { foreignKey: "user_id" });

Reservation.hasMany(ReservationItem, { foreignKey: "reservation_id", as: "items" });
ReservationItem.belongsTo(Reservation, { foreignKey: "reservation_id" });

Reservation.hasOne(ReservationFulfillment, { foreignKey: "reservation_id", as: "fulfillment" });
ReservationFulfillment.belongsTo(Reservation, { foreignKey: "reservation_id" });

Reservation.hasMany(ReservationAdjustment, { foreignKey: "reservation_id", as: "adjustments" });
ReservationAdjustment.belongsTo(Reservation, { foreignKey: "reservation_id" });

Costume.hasMany(ReservationItem, { foreignKey: "costume_id" });
ReservationItem.belongsTo(Costume, { foreignKey: "costume_id" });

User.hasMany(Payment, { foreignKey: "user_id" });
Payment.belongsTo(User, { foreignKey: "user_id" });

ReservationAdjustment.hasMany(Payment, {
  foreignKey: "reservation_adjustment_id",
  as: "payments"
});
Payment.belongsTo(ReservationAdjustment, {
  foreignKey: "reservation_adjustment_id",
  as: "reservationAdjustment"
});

UserSavedLocation.hasMany(ReservationFulfillment, {
  foreignKey: "outbound_location_id",
  as: "outboundFulfillments"
});
ReservationFulfillment.belongsTo(UserSavedLocation, {
  foreignKey: "outbound_location_id",
  as: "outboundLocation"
});

UserSavedLocation.hasMany(ReservationFulfillment, {
  foreignKey: "return_location_id",
  as: "returnFulfillments"
});
ReservationFulfillment.belongsTo(UserSavedLocation, {
  foreignKey: "return_location_id",
  as: "returnLocation"
});

// Legacy single association removed since Payment uses reservation_ids (JSON array)
// Reservation.hasMany(Payment, { foreignKey: "reservation_id" });
// Payment.belongsTo(Reservation, { foreignKey: "reservation_id" });

Reservation.hasMany(Message, { foreignKey: "reservation_id" });
Message.belongsTo(Reservation, { foreignKey: "reservation_id" });

User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(WishlistItem, { foreignKey: "user_id" });
WishlistItem.belongsTo(User, { foreignKey: "user_id" });

Costume.hasMany(WishlistItem, { foreignKey: "costume_id" });
WishlistItem.belongsTo(Costume, { foreignKey: "costume_id" });

User.hasMany(Review, { foreignKey: "user_id" });
Review.belongsTo(User, { foreignKey: "user_id" });

Costume.hasMany(Review, { foreignKey: "costume_id" });
Review.belongsTo(Costume, { foreignKey: "costume_id" });

Costume.hasMany(Inventory, { foreignKey: "costume_id" });
Inventory.belongsTo(Costume, { foreignKey: "costume_id" });

export const db = {
  sequelize,
  User,
  OAuthAccount,
  Costume,
  CostumeImage,
  Inventory,
  Reservation,
  ReservationItem,
  Payment,
  Notification,
  WishlistItem,
  Review,
  VendorProfile,
  Message,
  Subscription,
  VendorFulfillmentSettings,
  CostumeFulfillmentOverride,
  UserSavedLocation,
  UserFulfillmentPreferences,
  UserNotificationPreferences,
  ReservationFulfillment,
  ReservationAdjustment,
  VendorPaymentMethod,
  DeliveryOrder,
  AdminAuditLog,
  ContentReport,
  Dispute,
  DisputeMessage,
  VendorEarningEntry,
  VendorPayout,
  PlatformSetting
};
