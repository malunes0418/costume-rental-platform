import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { FulfillmentMode, JsonObject, LocationSnapshot } from "../domain/fulfillment";

export type DeliveryProvider = "MANUAL" | "LALAMOVE";

export interface VendorFulfillmentSettingsAttributes {
  id: number;
  vendor_id: number;
  primary_location: LocationSnapshot | null;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee: number;
  outbound_delivery_fee: number;
  return_pickup_fee: number;
  return_delivery_fee: number;
  service_areas: JsonObject | JsonObject[] | null;
  delivery_provider: DeliveryProvider;
  lalamove_service_type: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface VendorFulfillmentSettingsCreationAttributes
  extends Optional<
    VendorFulfillmentSettingsAttributes,
    "id" | "primary_location" | "service_areas" | "delivery_provider" | "lalamove_service_type"
  > {}

export class VendorFulfillmentSettings
  extends Model<VendorFulfillmentSettingsAttributes, VendorFulfillmentSettingsCreationAttributes>
  implements VendorFulfillmentSettingsAttributes
{
  public id!: number;
  public vendor_id!: number;
  public primary_location!: LocationSnapshot | null;
  public outbound_mode!: FulfillmentMode;
  public return_mode!: FulfillmentMode;
  public outbound_pickup_fee!: number;
  public outbound_delivery_fee!: number;
  public return_pickup_fee!: number;
  public return_delivery_fee!: number;
  public service_areas!: JsonObject | JsonObject[] | null;
  public delivery_provider!: DeliveryProvider;
  public lalamove_service_type!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

VendorFulfillmentSettings.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    primary_location: { type: DataTypes.JSON, allowNull: true },
    outbound_mode: {
      type: DataTypes.ENUM("PICKUP", "DELIVERY", "BOTH"),
      allowNull: false,
      defaultValue: "BOTH"
    },
    return_mode: {
      type: DataTypes.ENUM("PICKUP", "DELIVERY", "BOTH"),
      allowNull: false,
      defaultValue: "BOTH"
    },
    outbound_pickup_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    outbound_delivery_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    return_pickup_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    return_delivery_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    service_areas: { type: DataTypes.JSON, allowNull: true },
    delivery_provider: {
      type: DataTypes.ENUM("MANUAL", "LALAMOVE"),
      allowNull: false,
      defaultValue: "MANUAL"
    },
    lalamove_service_type: { type: DataTypes.STRING(60), allowNull: true, defaultValue: "MOTORCYCLE" },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "vendor_fulfillment_settings",
    timestamps: false
  }
);
