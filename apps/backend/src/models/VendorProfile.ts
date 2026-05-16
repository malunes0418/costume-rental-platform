import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface VendorProfileAttributes {
  id: number;
  user_id: number;
  business_name?: string | null;
  bio?: string | null;
  id_document_url: string;
  review_note?: string | null;
  reviewed_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface VendorProfileCreationAttributes extends Optional<VendorProfileAttributes, "id"> {}

export class VendorProfile extends Model<VendorProfileAttributes, VendorProfileCreationAttributes> implements VendorProfileAttributes {
  public id!: number;
  public user_id!: number;
  public business_name!: string | null;
  public bio!: string | null;
  public id_document_url!: string;
  public review_note!: string | null;
  public reviewed_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

VendorProfile.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    business_name: { type: DataTypes.STRING(255), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    id_document_url: { type: DataTypes.STRING(500), allowNull: false },
    review_note: { type: DataTypes.TEXT, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "vendor_profiles",
    timestamps: false
  }
);
