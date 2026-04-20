import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface MessageAttributes {
  id: number;
  reservation_id: number;
  sender_id: number;
  content: string;
  created_at?: Date;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, "id"> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public reservation_id!: number;
  public sender_id!: number;
  public content!: string;
  public created_at!: Date;
}

Message.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "messages",
    timestamps: false
  }
);
