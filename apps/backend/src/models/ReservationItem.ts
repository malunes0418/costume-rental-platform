import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { PricingMode } from "../utils/pricing";

export interface ReservationItemAttributes {
  id: number;
  reservation_id: number;
  costume_id: number;
  quantity: number;
  price_per_day: number;
  pricing_mode: PricingMode;
  package_base_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  subtotal: number;
}

export interface ReservationItemCreationAttributes
  extends Optional<
    ReservationItemAttributes,
    | "id"
    | "pricing_mode"
    | "package_base_price"
    | "package_included_days"
    | "package_unused_day_discount"
    | "package_extra_day_charge"
  > {}

export class ReservationItem extends Model<ReservationItemAttributes, ReservationItemCreationAttributes> implements ReservationItemAttributes {
  public id!: number;
  public reservation_id!: number;
  public costume_id!: number;
  public quantity!: number;
  public price_per_day!: number;
  public pricing_mode!: PricingMode;
  public package_base_price!: number | null;
  public package_included_days!: number | null;
  public package_unused_day_discount!: number | null;
  public package_extra_day_charge!: number | null;
  public subtotal!: number;
}

ReservationItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    pricing_mode: { type: DataTypes.ENUM("PER_DAY", "PACKAGE"), allowNull: false, defaultValue: "PER_DAY" },
    package_base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    package_included_days: { type: DataTypes.INTEGER, allowNull: true },
    package_unused_day_discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    package_extra_day_charge: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  },
  {
    sequelize,
    tableName: "reservation_items",
    timestamps: false
  }
);
