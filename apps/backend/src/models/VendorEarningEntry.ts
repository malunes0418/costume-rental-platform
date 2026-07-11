import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type VendorEarningEntryStatus =
  | "PENDING"
  | "AVAILABLE"
  | "HELD"
  | "INCLUDED_IN_PAYOUT"
  | "PAID"
  | "VOID";

export interface VendorEarningEntryAttributes {
  id: number;
  vendor_id: number;
  reservation_id: number;
  gross_amount: number;
  fee_rate: number;
  fee_amount: number;
  net_amount: number;
  status: VendorEarningEntryStatus;
  payout_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface VendorEarningEntryCreationAttributes
  extends Optional<
    VendorEarningEntryAttributes,
    "id" | "status" | "payout_id" | "created_at" | "updated_at"
  > {}

export class VendorEarningEntry
  extends Model<VendorEarningEntryAttributes, VendorEarningEntryCreationAttributes>
  implements VendorEarningEntryAttributes
{
  public id!: number;
  public vendor_id!: number;
  public reservation_id!: number;
  public gross_amount!: number;
  public fee_rate!: number;
  public fee_amount!: number;
  public net_amount!: number;
  public status!: VendorEarningEntryStatus;
  public payout_id!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

VendorEarningEntry.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    gross_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fee_rate: { type: DataTypes.DECIMAL(6, 4), allowNull: false },
    fee_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    net_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("PENDING", "AVAILABLE", "HELD", "INCLUDED_IN_PAYOUT", "PAID", "VOID"),
      allowNull: false,
      defaultValue: "AVAILABLE"
    },
    payout_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "vendor_earning_entries",
    timestamps: false
  }
);
