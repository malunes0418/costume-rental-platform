import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface DisputeMessageAttributes {
  id: number;
  dispute_id: number;
  author_id: number;
  body: string;
  created_at?: Date;
}

export interface DisputeMessageCreationAttributes
  extends Optional<DisputeMessageAttributes, "id" | "created_at"> {}

export class DisputeMessage
  extends Model<DisputeMessageAttributes, DisputeMessageCreationAttributes>
  implements DisputeMessageAttributes
{
  public id!: number;
  public dispute_id!: number;
  public author_id!: number;
  public body!: string;
  public created_at!: Date;
}

DisputeMessage.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    dispute_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    author_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "dispute_messages",
    timestamps: false,
    updatedAt: false
  }
);
