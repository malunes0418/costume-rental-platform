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

User.hasMany(OAuthAccount, { foreignKey: "user_id" });
OAuthAccount.belongsTo(User, { foreignKey: "user_id" });

Costume.hasMany(CostumeImage, { foreignKey: "costume_id" });
CostumeImage.belongsTo(Costume, { foreignKey: "costume_id" });

User.hasMany(Reservation, { foreignKey: "user_id" });
Reservation.belongsTo(User, { foreignKey: "user_id" });

Reservation.hasMany(ReservationItem, { foreignKey: "reservation_id", as: "items" });
ReservationItem.belongsTo(Reservation, { foreignKey: "reservation_id" });

Costume.hasMany(ReservationItem, { foreignKey: "costume_id" });
ReservationItem.belongsTo(Costume, { foreignKey: "costume_id" });

User.hasMany(Payment, { foreignKey: "user_id" });
Payment.belongsTo(User, { foreignKey: "user_id" });

Reservation.hasMany(Payment, { foreignKey: "reservation_id" });
Payment.belongsTo(Reservation, { foreignKey: "reservation_id" });

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
  Review
};
