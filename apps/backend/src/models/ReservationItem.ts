import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface ReservationItemAttributes {
  id: number;
  reservation_id: number;
  costume_id: number;
  quantity: number;
  price_per_day: number;
  subtotal: number;
}

export interface ReservationItemCreationAttributes extends Optional<ReservationItemAttributes, "id"> {}

export class ReservationItem extends Model<ReservationItemAttributes, ReservationItemCreationAttributes> implements ReservationItemAttributes {
  public id!: number;
  public reservation_id!: number;
  public costume_id!: number;
  public quantity!: number;
  public price_per_day!: number;
  public subtotal!: number;
}

ReservationItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  },
  {
    sequelize,
    tableName: "reservation_items",
    timestamps: false
  }
);
