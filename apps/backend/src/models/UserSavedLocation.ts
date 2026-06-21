import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface UserSavedLocationAttributes {
  id: number;
  user_id: number;
  label: string;
  contact_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string | null;
  barangay?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  area?: string | null;
  notes?: string | null;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserSavedLocationCreationAttributes
  extends Optional<
    UserSavedLocationAttributes,
    "id" | "address_line_2" | "barangay" | "province" | "postal_code" | "country" | "area" | "notes" | "is_default"
  > {}

export class UserSavedLocation
  extends Model<UserSavedLocationAttributes, UserSavedLocationCreationAttributes>
  implements UserSavedLocationAttributes
{
  public id!: number;
  public user_id!: number;
  public label!: string;
  public contact_name!: string;
  public phone_number!: string;
  public address_line_1!: string;
  public address_line_2!: string | null;
  public barangay!: string | null;
  public city!: string;
  public province!: string | null;
  public postal_code!: string | null;
  public country!: string | null;
  public area!: string | null;
  public notes!: string | null;
  public is_default!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

UserSavedLocation.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    label: { type: DataTypes.STRING(120), allowNull: false },
    contact_name: { type: DataTypes.STRING(120), allowNull: false },
    phone_number: { type: DataTypes.STRING(60), allowNull: false },
    address_line_1: { type: DataTypes.STRING(255), allowNull: false },
    address_line_2: { type: DataTypes.STRING(255), allowNull: true },
    barangay: { type: DataTypes.STRING(120), allowNull: true },
    city: { type: DataTypes.STRING(120), allowNull: false },
    province: { type: DataTypes.STRING(120), allowNull: true },
    postal_code: { type: DataTypes.STRING(30), allowNull: true },
    country: { type: DataTypes.STRING(120), allowNull: true, defaultValue: "Philippines" },
    area: { type: DataTypes.STRING(120), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "user_saved_locations",
    timestamps: false
  }
);
