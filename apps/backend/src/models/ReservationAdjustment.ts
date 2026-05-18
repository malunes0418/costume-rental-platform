import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { ReservationAdjustmentStatus, ReservationAdjustmentType } from "../domain/fulfillment";

export interface ReservationAdjustmentAttributes {
  id: number;
  reservation_id: number;
  type: ReservationAdjustmentType;
  amount: number;
  status: ReservationAdjustmentStatus;
  note?: string | null;
  created_by_user_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReservationAdjustmentCreationAttributes
  extends Optional<ReservationAdjustmentAttributes, "id" | "note" | "created_by_user_id"> {}

export class ReservationAdjustment
  extends Model<ReservationAdjustmentAttributes, ReservationAdjustmentCreationAttributes>
  implements ReservationAdjustmentAttributes
{
  public id!: number;
  public reservation_id!: number;
  public type!: ReservationAdjustmentType;
  public amount!: number;
  public status!: ReservationAdjustmentStatus;
  public note!: string | null;
  public created_by_user_id!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

ReservationAdjustment.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM("OUTSIDE_AREA_SURCHARGE"), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID", "WAIVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING"
    },
    note: { type: DataTypes.TEXT, allowNull: true },
    created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "reservation_adjustments",
    timestamps: false
  }
);
