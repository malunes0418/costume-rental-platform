import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

export interface DisputeAttributes {
  id: number;
  reservation_id: number;
  opened_by: number;
  against_user_id?: number | null;
  subject: string;
  status: DisputeStatus;
  resolution_note?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface DisputeCreationAttributes
  extends Optional<
    DisputeAttributes,
    "id" | "against_user_id" | "status" | "resolution_note" | "created_at" | "updated_at"
  > {}

export class Dispute
  extends Model<DisputeAttributes, DisputeCreationAttributes>
  implements DisputeAttributes
{
  public id!: number;
  public reservation_id!: number;
  public opened_by!: number;
  public against_user_id!: number | null;
  public subject!: string;
  public status!: DisputeStatus;
  public resolution_note!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

Dispute.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    opened_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    against_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM("OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"),
      allowNull: false,
      defaultValue: "OPEN"
    },
    resolution_note: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "disputes",
    timestamps: false
  }
);
