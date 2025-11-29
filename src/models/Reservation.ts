import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type ReservationStatus = "CART" | "PENDING_PAYMENT" | "PAID" | "CANCELLED";

export interface ReservationAttributes {
  id: number;
  user_id: number;
  status: ReservationStatus;
  total_price: number;
  currency: string;
  start_date: string;
  end_date: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReservationCreationAttributes extends Optional<ReservationAttributes, "id" | "status" | "total_price" | "currency"> {}

export class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  public id!: number;
  public user_id!: number;
  public status!: ReservationStatus;
  public total_price!: number;
  public currency!: string;
  public start_date!: string;
  public end_date!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Reservation.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM("CART", "PENDING_PAYMENT", "PAID", "CANCELLED"), allowNull: false, defaultValue: "CART" },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "USD" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "reservations",
    timestamps: false
  }
);
