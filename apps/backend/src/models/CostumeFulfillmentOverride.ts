import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import type { FulfillmentMode } from "../domain/fulfillment";

export interface CostumeFulfillmentOverrideAttributes {
  id: number;
  costume_id: number;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  created_at?: Date;
  updated_at?: Date;
}

export interface CostumeFulfillmentOverrideCreationAttributes
  extends Optional<CostumeFulfillmentOverrideAttributes, "id"> {}

export class CostumeFulfillmentOverride
  extends Model<CostumeFulfillmentOverrideAttributes, CostumeFulfillmentOverrideCreationAttributes>
  implements CostumeFulfillmentOverrideAttributes
{
  public id!: number;
  public costume_id!: number;
  public outbound_mode!: FulfillmentMode;
  public return_mode!: FulfillmentMode;
  public created_at!: Date;
  public updated_at!: Date;
}

CostumeFulfillmentOverride.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    outbound_mode: { type: DataTypes.ENUM("PICKUP", "DELIVERY", "BOTH"), allowNull: false },
    return_mode: { type: DataTypes.ENUM("PICKUP", "DELIVERY", "BOTH"), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "costume_fulfillment_overrides",
    timestamps: false
  }
);
