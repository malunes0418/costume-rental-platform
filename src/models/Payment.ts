import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaymentAttributes {
  id: number;
  reservation_id: number;
  user_id: number;
  amount: number;
  status: PaymentStatus;
  proof_url?: string | null;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, "id" | "status"> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public reservation_id!: number;
  public user_id!: number;
  public amount!: number;
  public status!: PaymentStatus;
  public proof_url!: string | null;
  public notes!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Payment.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"), allowNull: false, defaultValue: "PENDING" },
    proof_url: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "payments",
    timestamps: false
  }
);
