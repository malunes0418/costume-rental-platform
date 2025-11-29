import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface InventoryAttributes {
  id: number;
  costume_id: number;
  date: string;
  quantity_available: number;
}

export interface InventoryCreationAttributes extends Optional<InventoryAttributes, "id"> {}

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public costume_id!: number;
  public date!: string;
  public quantity_available!: number;
}

Inventory.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    costume_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    quantity_available: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    sequelize,
    tableName: "inventory",
    timestamps: false
  }
);
