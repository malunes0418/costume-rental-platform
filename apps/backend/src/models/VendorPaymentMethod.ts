import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type VendorPaymentMethodType = "GCASH" | "MAYA" | "BANK" | "OTHER";

export interface VendorPaymentMethodAttributes {
  id: number;
  user_id: number;
  method_type: VendorPaymentMethodType;
  label: string;
  account_name: string;
  account_number: string;
  bank_name?: string | null;
  qr_image_url?: string | null;
  instructions?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface VendorPaymentMethodCreationAttributes
  extends Optional<
    VendorPaymentMethodAttributes,
    "id" | "bank_name" | "qr_image_url" | "instructions" | "sort_order" | "is_active"
  > {}

export class VendorPaymentMethod
  extends Model<VendorPaymentMethodAttributes, VendorPaymentMethodCreationAttributes>
  implements VendorPaymentMethodAttributes
{
  public id!: number;
  public user_id!: number;
  public method_type!: VendorPaymentMethodType;
  public label!: string;
  public account_name!: string;
  public account_number!: string;
  public bank_name!: string | null;
  public qr_image_url!: string | null;
  public instructions!: string | null;
  public sort_order!: number;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

VendorPaymentMethod.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    method_type: {
      type: DataTypes.ENUM("GCASH", "MAYA", "BANK", "OTHER"),
      allowNull: false
    },
    label: { type: DataTypes.STRING(255), allowNull: false },
    account_name: { type: DataTypes.STRING(255), allowNull: false },
    account_number: { type: DataTypes.STRING(255), allowNull: false },
    bank_name: { type: DataTypes.STRING(255), allowNull: true },
    qr_image_url: { type: DataTypes.STRING(500), allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "vendor_payment_methods",
    timestamps: false
  }
);
