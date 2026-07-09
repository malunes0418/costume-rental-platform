import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type DeliveryLeg = "OUTBOUND" | "RETURN";

export interface DeliveryOrderAttributes {
  id: number;
  reservation_id: number;
  leg: DeliveryLeg;
  lalamove_order_id?: string | null;
  quotation_id?: string | null;
  service_type?: string | null;
  status?: string | null;
  price_amount: number;
  price_currency: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  share_link?: string | null;
  raw_webhook_payload?: Record<string, unknown> | null;
  checkout_fee_estimate?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface DeliveryOrderCreationAttributes
  extends Optional<
    DeliveryOrderAttributes,
    | "id"
    | "lalamove_order_id"
    | "quotation_id"
    | "service_type"
    | "status"
    | "price_currency"
    | "driver_name"
    | "driver_phone"
    | "share_link"
    | "raw_webhook_payload"
    | "checkout_fee_estimate"
  > {}

export class DeliveryOrder
  extends Model<DeliveryOrderAttributes, DeliveryOrderCreationAttributes>
  implements DeliveryOrderAttributes
{
  public id!: number;
  public reservation_id!: number;
  public leg!: DeliveryLeg;
  public lalamove_order_id!: string | null;
  public quotation_id!: string | null;
  public service_type!: string | null;
  public status!: string | null;
  public price_amount!: number;
  public price_currency!: string;
  public driver_name!: string | null;
  public driver_phone!: string | null;
  public share_link!: string | null;
  public raw_webhook_payload!: Record<string, unknown> | null;
  public checkout_fee_estimate!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

DeliveryOrder.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    leg: { type: DataTypes.ENUM("OUTBOUND", "RETURN"), allowNull: false },
    lalamove_order_id: { type: DataTypes.STRING(120), allowNull: true },
    quotation_id: { type: DataTypes.STRING(120), allowNull: true },
    service_type: { type: DataTypes.STRING(60), allowNull: true },
    status: { type: DataTypes.STRING(60), allowNull: true },
    price_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    price_currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "PHP" },
    driver_name: { type: DataTypes.STRING(120), allowNull: true },
    driver_phone: { type: DataTypes.STRING(60), allowNull: true },
    share_link: { type: DataTypes.STRING(512), allowNull: true },
    raw_webhook_payload: { type: DataTypes.JSON, allowNull: true },
    checkout_fee_estimate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "delivery_orders",
    timestamps: false
  }
);
