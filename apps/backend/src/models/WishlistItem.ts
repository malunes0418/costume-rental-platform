import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface WishlistItemAttributes {
  id: number;
  user_id: number;
  costume_id: number;
  created_at?: Date;
}

export interface WishlistItemCreationAttributes extends Optional<WishlistItemAttributes, "id"> {}

export class WishlistItem extends Model<WishlistItemAttributes, WishlistItemCreationAttributes> implements WishlistItemAttributes {
  public id!: number;
  public user_id!: number;
  public costume_id!: number;
  public created_at!: Date;
}

WishlistItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "wishlist_items",
    timestamps: false
  }
);
