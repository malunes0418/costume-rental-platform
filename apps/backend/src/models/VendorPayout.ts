import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type VendorPayoutStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type VendorPayoutPaymentMethodSnapshot = {
  id?: number;
  method_type: string;
  label: string;
  account_name: string;
  account_number: string;
  bank_name?: string | null;
  qr_image_url?: string | null;
  instructions?: string | null;
};

export interface VendorPayoutAttributes {
  id: number;
  vendor_id: number;
  amount: number;
  currency: string;
  status: VendorPayoutStatus;
  payment_method_snapshot?: VendorPayoutPaymentMethodSnapshot | null;
  notes?: string | null;
  failure_reason?: string | null;
  created_by: number;
  paid_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface VendorPayoutCreationAttributes
  extends Optional<
    VendorPayoutAttributes,
    | "id"
    | "currency"
    | "status"
    | "payment_method_snapshot"
    | "notes"
    | "failure_reason"
    | "paid_at"
    | "created_at"
    | "updated_at"
  > {}

export class VendorPayout
  extends Model<VendorPayoutAttributes, VendorPayoutCreationAttributes>
  implements VendorPayoutAttributes
{
  public id!: number;
  public vendor_id!: number;
  public amount!: number;
  public currency!: string;
  public status!: VendorPayoutStatus;
  public payment_method_snapshot!: VendorPayoutPaymentMethodSnapshot | null;
  public notes!: string | null;
  public failure_reason!: string | null;
  public created_by!: number;
  public paid_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

VendorPayout.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "PHP" },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "CANCELLED"),
      allowNull: false,
      defaultValue: "PENDING"
    },
    payment_method_snapshot: { type: DataTypes.JSON, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    failure_reason: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "vendor_payouts",
    timestamps: false
  }
);
