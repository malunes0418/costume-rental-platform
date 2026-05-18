import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { PricingMode } from "../utils/pricing";

export interface CostumeAttributes {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  size?: string | null;
  gender?: string | null;
  theme?: string | null;
  pricing_mode: PricingMode;
  base_price_per_day?: number | null;
  package_price?: number | null;
  package_included_days?: number | null;
  package_unused_day_discount?: number | null;
  package_extra_day_charge?: number | null;
  deposit_amount: number;
  stock: number;
  is_active: boolean;
  owner_id?: number | null;
  status: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";
  created_at?: Date;
  updated_at?: Date;
}

export interface CostumeCreationAttributes
  extends Optional<
    CostumeAttributes,
    | "id"
    | "pricing_mode"
    | "base_price_per_day"
    | "package_price"
    | "package_included_days"
    | "package_unused_day_discount"
    | "package_extra_day_charge"
    | "deposit_amount"
    | "stock"
    | "is_active"
    | "status"
  > {}

export class Costume extends Model<CostumeAttributes, CostumeCreationAttributes> implements CostumeAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public category!: string | null;
  public size!: string | null;
  public gender!: string | null;
  public theme!: string | null;
  public pricing_mode!: PricingMode;
  public base_price_per_day!: number | null;
  public package_price!: number | null;
  public package_included_days!: number | null;
  public package_unused_day_discount!: number | null;
  public package_extra_day_charge!: number | null;
  public deposit_amount!: number;
  public stock!: number;
  public is_active!: boolean;
  public owner_id!: number | null;
  public status!: "DRAFT" | "ACTIVE" | "HIDDEN" | "FLAGGED";
  public created_at!: Date;
  public updated_at!: Date;
}

Costume.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    size: { type: DataTypes.STRING(50), allowNull: true },
    gender: { type: DataTypes.STRING(50), allowNull: true },
    theme: { type: DataTypes.STRING(100), allowNull: true },
    pricing_mode: { type: DataTypes.ENUM("PER_DAY", "PACKAGE"), allowNull: false, defaultValue: "PER_DAY" },
    base_price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    package_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    package_included_days: { type: DataTypes.INTEGER, allowNull: true },
    package_unused_day_discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    package_extra_day_charge: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    deposit_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    owner_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM("DRAFT", "ACTIVE", "HIDDEN", "FLAGGED"), allowNull: false, defaultValue: "ACTIVE" },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "costumes",
    timestamps: false
  }
);
