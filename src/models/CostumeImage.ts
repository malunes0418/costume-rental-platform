import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface CostumeImageAttributes {
  id: number;
  costume_id: number;
  image_url: string;
  is_primary: boolean;
}

export interface CostumeImageCreationAttributes extends Optional<CostumeImageAttributes, "id" | "is_primary"> {}

export class CostumeImage extends Model<CostumeImageAttributes, CostumeImageCreationAttributes> implements CostumeImageAttributes {
  public id!: number;
  public costume_id!: number;
  public image_url!: string;
  public is_primary!: boolean;
}

CostumeImage.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    image_url: { type: DataTypes.STRING(500), allowNull: false },
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  },
  {
    sequelize,
    tableName: "costume_images",
    timestamps: false
  }
);
