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
  return_fee_is_estimate: boolean;
  outside_service_area: boolean;
  vendor_approval_status: ReservationFulfillmentApprovalStatus;
  vendor_approval_note?: string | null;
  outbound_dispatched_at?: Date | null;
  outbound_dispatch_proof_url?: string | null;
  renter_received_at?: Date | null;
  renter_received_proof_url?: string | null;
  return_initiated_at?: Date | null;
  return_initiated_proof_url?: string | null;
  vendor_return_received_at?: Date | null;
  vendor_return_proof_url?: string | null;
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
    | "return_fee_is_estimate"
    | "vendor_approval_note"
    | "outbound_dispatched_at"
    | "outbound_dispatch_proof_url"
    | "renter_received_at"
    | "renter_received_proof_url"
    | "return_initiated_at"
    | "return_initiated_proof_url"
    | "vendor_return_received_at"
    | "vendor_return_proof_url"
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
  public return_fee_is_estimate!: boolean;
  public outside_service_area!: boolean;
  public vendor_approval_status!: ReservationFulfillmentApprovalStatus;
  public vendor_approval_note!: string | null;
  public outbound_dispatched_at!: Date | null;
  public outbound_dispatch_proof_url!: string | null;
  public renter_received_at!: Date | null;
  public renter_received_proof_url!: string | null;
  public return_initiated_at!: Date | null;
  public return_initiated_proof_url!: string | null;
  public vendor_return_received_at!: Date | null;
  public vendor_return_proof_url!: string | null;
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
    return_fee_is_estimate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    outside_service_area: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    vendor_approval_status: {
      type: DataTypes.ENUM("PENDING_VENDOR_REVIEW", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING_VENDOR_REVIEW"
    },
    vendor_approval_note: { type: DataTypes.TEXT, allowNull: true },
    outbound_dispatched_at: { type: DataTypes.DATE, allowNull: true },
    outbound_dispatch_proof_url: { type: DataTypes.STRING(512), allowNull: true },
    renter_received_at: { type: DataTypes.DATE, allowNull: true },
    renter_received_proof_url: { type: DataTypes.STRING(512), allowNull: true },
    return_initiated_at: { type: DataTypes.DATE, allowNull: true },
    return_initiated_proof_url: { type: DataTypes.STRING(512), allowNull: true },
    vendor_return_received_at: { type: DataTypes.DATE, allowNull: true },
    vendor_return_proof_url: { type: DataTypes.STRING(512), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "reservation_fulfillment",
    timestamps: false
  }
);
