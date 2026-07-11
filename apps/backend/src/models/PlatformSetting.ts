import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface PlatformSettingAttributes {
  id: number;
  key: string;
  value: unknown;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlatformSettingCreationAttributes
  extends Optional<PlatformSettingAttributes, "id" | "updated_by" | "created_at" | "updated_at"> {}

export class PlatformSetting
  extends Model<PlatformSettingAttributes, PlatformSettingCreationAttributes>
  implements PlatformSettingAttributes
{
  public id!: number;
  public key!: string;
  public value!: unknown;
  public updated_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

PlatformSetting.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    value: { type: DataTypes.JSON, allowNull: false },
    updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "platform_settings",
    timestamps: false
  }
);
