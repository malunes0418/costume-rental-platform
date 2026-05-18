import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import {
  type ReservationStatus,
  type ReservationVendorStatus
} from "../domain/reservationLifecycle";

export interface ReservationAttributes {
  id: number;
  user_id: number;
  status: ReservationStatus;
  vendor_status: ReservationVendorStatus;
  total_price: number;
  currency: string;
  start_date: string;
  end_date: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReservationCreationAttributes
  extends Optional<ReservationAttributes, "id" | "status" | "vendor_status" | "total_price" | "currency"> {}

export class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  public id!: number;
  public user_id!: number;
  public status!: ReservationStatus;
  public vendor_status!: ReservationVendorStatus;
  public total_price!: number;
  public currency!: string;
  public start_date!: string;
  public end_date!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Reservation.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "CART",
        "PENDING_PAYMENT",
        "PENDING_VENDOR_REVIEW",
        "AWAITING_SURCHARGE_PAYMENT",
        "CONFIRMED",
        "OUTBOUND_SCHEDULED",
        "OUTBOUND_IN_PROGRESS",
        "WITH_RENTER",
        "RETURN_SCHEDULED",
        "RETURN_IN_PROGRESS",
        "RETURNED",
        "COMPLETED",
        "CANCELLED",
        "REJECTED_BY_VENDOR"
      ),
      allowNull: false,
      defaultValue: "CART"
    },
    vendor_status: {
      type: DataTypes.ENUM("NOT_REQUIRED", "PENDING_VENDOR_REVIEW", "APPROVED_BY_VENDOR", "REJECTED_BY_VENDOR"),
      allowNull: false,
      defaultValue: "NOT_REQUIRED"
    },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "PHP" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "reservations",
    timestamps: false
  }
);
