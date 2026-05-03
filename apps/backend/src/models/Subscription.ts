import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface SubscriptionAttributes {
  id: number;
  user_id: number;
  plan_name: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  start_date: Date;
  end_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, "id" | "status" | "created_at" | "updated_at"> {}

export class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: number;
  public user_id!: number;
  public plan_name!: string;
  public status!: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  public start_date!: Date;
  public end_date!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

Subscription.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    plan_name: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM("ACTIVE", "PAST_DUE", "CANCELED", "TRIALING"), allowNull: false, defaultValue: "TRIALING" },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "subscriptions",
    timestamps: false
  }
);
