import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface UserNotificationPreferencesAttributes {
  user_id: number;
  reservations_email: boolean;
  reservations_push: boolean;
  payments_email: boolean;
  payments_push: boolean;
  messages_email: boolean;
  messages_push: boolean;
  marketing_email: boolean;
  marketing_push: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserNotificationPreferencesCreationAttributes
  extends Optional<
    UserNotificationPreferencesAttributes,
    | "reservations_email"
    | "reservations_push"
    | "payments_email"
    | "payments_push"
    | "messages_email"
    | "messages_push"
    | "marketing_email"
    | "marketing_push"
  > {}

export class UserNotificationPreferences
  extends Model<UserNotificationPreferencesAttributes, UserNotificationPreferencesCreationAttributes>
  implements UserNotificationPreferencesAttributes
{
  public user_id!: number;
  public reservations_email!: boolean;
  public reservations_push!: boolean;
  public payments_email!: boolean;
  public payments_push!: boolean;
  public messages_email!: boolean;
  public messages_push!: boolean;
  public marketing_email!: boolean;
  public marketing_push!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

UserNotificationPreferences.init(
  {
    user_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, allowNull: false },
    reservations_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    reservations_push: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    payments_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    payments_push: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    messages_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    messages_push: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    marketing_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    marketing_push: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "user_notification_preferences",
    timestamps: false
  }
);
