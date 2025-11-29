import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface CostumeAttributes {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  size?: string | null;
  gender?: string | null;
  theme?: string | null;
  base_price_per_day: number;
  deposit_amount: number;
  stock: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CostumeCreationAttributes extends Optional<CostumeAttributes, "id" | "deposit_amount" | "stock" | "is_active"> {}

export class Costume extends Model<CostumeAttributes, CostumeCreationAttributes> implements CostumeAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public category!: string | null;
  public size!: string | null;
  public gender!: string | null;
  public theme!: string | null;
  public base_price_per_day!: number;
  public deposit_amount!: number;
  public stock!: number;
  public is_active!: boolean;
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
    base_price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    deposit_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "costumes",
    timestamps: false
  }
);
