import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type {
  FulfillmentMethod,
  LocationSnapshot,
  ReservationFulfillmentApprovalStatus
} from "../domain/fulfillment";

export interface ReservationFulfillmentAttributes {
  id: number;
  reservation_id: number;
  outbound_method: FulfillmentMethod;
  return_method: FulfillmentMethod;
  outbound_location_id?: number | null;
  outbound_location_snapshot: LocationSnapshot | null;
  return_location_id?: number | null;
  return_location_snapshot: LocationSnapshot | null;
  pickup_window_start?: Date | null;
  pickup_window_end?: Date | null;
  delivery_window_start?: Date | null;
  delivery_window_end?: Date | null;
  return_window_start?: Date | null;
  return_window_end?: Date | null;
  outbound_fee: number;
  return_fee: number;
  outside_service_area: boolean;
  vendor_approval_status: ReservationFulfillmentApprovalStatus;
  vendor_approval_note?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReservationFulfillmentCreationAttributes
  extends Optional<
    ReservationFulfillmentAttributes,
    | "id"
    | "outbound_location_id"
    | "outbound_location_snapshot"
    | "return_location_id"
    | "return_location_snapshot"
    | "pickup_window_start"
    | "pickup_window_end"
    | "delivery_window_start"
    | "delivery_window_end"
    | "return_window_start"
    | "return_window_end"
    | "vendor_approval_note"
  > {}

export class ReservationFulfillment
  extends Model<ReservationFulfillmentAttributes, ReservationFulfillmentCreationAttributes>
  implements ReservationFulfillmentAttributes
{
  public id!: number;
  public reservation_id!: number;
  public outbound_method!: FulfillmentMethod;
  public return_method!: FulfillmentMethod;
  public outbound_location_id!: number | null;
  public outbound_location_snapshot!: LocationSnapshot | null;
  public return_location_id!: number | null;
  public return_location_snapshot!: LocationSnapshot | null;
  public pickup_window_start!: Date | null;
  public pickup_window_end!: Date | null;
  public delivery_window_start!: Date | null;
  public delivery_window_end!: Date | null;
  public return_window_start!: Date | null;
  public return_window_end!: Date | null;
  public outbound_fee!: number;
  public return_fee!: number;
  public outside_service_area!: boolean;
  public vendor_approval_status!: ReservationFulfillmentApprovalStatus;
  public vendor_approval_note!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

ReservationFulfillment.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    outbound_method: { type: DataTypes.ENUM("PICKUP", "DELIVERY"), allowNull: false },
    return_method: { type: DataTypes.ENUM("PICKUP", "DELIVERY"), allowNull: false },
    outbound_location_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    outbound_location_snapshot: { type: DataTypes.JSON, allowNull: true },
    return_location_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    return_location_snapshot: { type: DataTypes.JSON, allowNull: true },
    pickup_window_start: { type: DataTypes.DATE, allowNull: true },
    pickup_window_end: { type: DataTypes.DATE, allowNull: true },
    delivery_window_start: { type: DataTypes.DATE, allowNull: true },
    delivery_window_end: { type: DataTypes.DATE, allowNull: true },
    return_window_start: { type: DataTypes.DATE, allowNull: true },
    return_window_end: { type: DataTypes.DATE, allowNull: true },
    outbound_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    return_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    outside_service_area: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    vendor_approval_status: {
      type: DataTypes.ENUM("PENDING_VENDOR_REVIEW", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING_VENDOR_REVIEW"
    },
    vendor_approval_note: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "reservation_fulfillment",
    timestamps: false
  }
);
