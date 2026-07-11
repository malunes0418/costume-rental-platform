import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface AdminAuditLogAttributes {
  id: number;
  actor_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: Date;
}

export interface AdminAuditLogCreationAttributes
  extends Optional<
    AdminAuditLogAttributes,
    "id" | "before_json" | "after_json" | "reason" | "metadata" | "created_at"
  > {}

export class AdminAuditLog
  extends Model<AdminAuditLogAttributes, AdminAuditLogCreationAttributes>
  implements AdminAuditLogAttributes
{
  public id!: number;
  public actor_id!: number;
  public action!: string;
  public entity_type!: string;
  public entity_id!: number;
  public before_json!: Record<string, unknown> | null;
  public after_json!: Record<string, unknown> | null;
  public reason!: string | null;
  public metadata!: Record<string, unknown> | null;
  public created_at!: Date;
}

AdminAuditLog.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    actor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(60), allowNull: false },
    entity_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    before_json: { type: DataTypes.JSON, allowNull: true },
    after_json: { type: DataTypes.JSON, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "admin_audit_logs",
    timestamps: false,
    updatedAt: false
  }
);
