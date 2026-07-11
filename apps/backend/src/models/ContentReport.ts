import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export type ContentReportTargetType = "COSTUME" | "USER" | "REVIEW" | "OTHER";
export type ContentReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export interface ContentReportAttributes {
  id: number;
  reporter_id?: number | null;
  target_type: ContentReportTargetType;
  target_id: number;
  reason: string;
  details?: string | null;
  status: ContentReportStatus;
  resolution_note?: string | null;
  resolved_by?: number | null;
  resolved_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContentReportCreationAttributes
  extends Optional<
    ContentReportAttributes,
    | "id"
    | "reporter_id"
    | "details"
    | "status"
    | "resolution_note"
    | "resolved_by"
    | "resolved_at"
    | "created_at"
    | "updated_at"
  > {}

export class ContentReport
  extends Model<ContentReportAttributes, ContentReportCreationAttributes>
  implements ContentReportAttributes
{
  public id!: number;
  public reporter_id!: number | null;
  public target_type!: ContentReportTargetType;
  public target_id!: number;
  public reason!: string;
  public details!: string | null;
  public status!: ContentReportStatus;
  public resolution_note!: string | null;
  public resolved_by!: number | null;
  public resolved_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;
}

ContentReport.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    reporter_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    target_type: {
      type: DataTypes.ENUM("COSTUME", "USER", "REVIEW", "OTHER"),
      allowNull: false
    },
    target_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("OPEN", "RESOLVED", "DISMISSED"),
      allowNull: false,
      defaultValue: "OPEN"
    },
    resolution_note: { type: DataTypes.TEXT, allowNull: true },
    resolved_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    resolved_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "content_reports",
    timestamps: false
  }
);
