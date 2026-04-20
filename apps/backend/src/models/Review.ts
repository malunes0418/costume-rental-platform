import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface ReviewAttributes {
  id: number;
  user_id: number;
  costume_id: number;
  rating: number;
  comment?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReviewCreationAttributes extends Optional<ReviewAttributes, "id"> {}

export class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: number;
  public user_id!: number;
  public costume_id!: number;
  public rating!: number;
  public comment!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Review.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "reviews",
    timestamps: false
  }
);
