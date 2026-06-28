import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { FulfillmentWindowSlot } from "../domain/fulfillment";

export interface UserFulfillmentPreferencesAttributes {
  user_id: number;
  default_saved_location_id?: number | null;
  default_delivery_window_slot?: FulfillmentWindowSlot | null;
  default_return_window_slot?: FulfillmentWindowSlot | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserFulfillmentPreferencesCreationAttributes
  extends Optional<
    UserFulfillmentPreferencesAttributes,
    "default_saved_location_id" | "default_delivery_window_slot" | "default_return_window_slot"
  > {}

export class UserFulfillmentPreferences
  extends Model<UserFulfillmentPreferencesAttributes, UserFulfillmentPreferencesCreationAttributes>
  implements UserFulfillmentPreferencesAttributes
{
  public user_id!: number;
  public default_saved_location_id!: number | null;
  public default_delivery_window_slot!: FulfillmentWindowSlot | null;
  public default_return_window_slot!: FulfillmentWindowSlot | null;
  public created_at!: Date;
  public updated_at!: Date;
}

UserFulfillmentPreferences.init(
  {
    user_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, allowNull: false },
    default_saved_location_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    default_delivery_window_slot: {
      type: DataTypes.ENUM("MORNING", "AFTERNOON", "EVENING"),
      allowNull: true
    },
    default_return_window_slot: {
      type: DataTypes.ENUM("MORNING", "AFTERNOON", "EVENING"),
      allowNull: true
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "user_fulfillment_preferences",
    timestamps: false
  }
);
