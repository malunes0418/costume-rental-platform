import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface OAuthAccountAttributes {
  id: number;
  user_id: number;
  provider: string;
  provider_user_id: string;
  access_token?: string | null;
  refresh_token?: string | null;
  created_at?: Date;
}

export interface OAuthAccountCreationAttributes extends Optional<OAuthAccountAttributes, "id"> {}

export class OAuthAccount extends Model<OAuthAccountAttributes, OAuthAccountCreationAttributes> implements OAuthAccountAttributes {
  public id!: number;
  public user_id!: number;
  public provider!: string;
  public provider_user_id!: string;
  public access_token!: string | null;
  public refresh_token!: string | null;
  public created_at!: Date;
}

OAuthAccount.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    provider: { type: DataTypes.STRING(50), allowNull: false },
    provider_user_id: { type: DataTypes.STRING(255), allowNull: false },
    access_token: { type: DataTypes.STRING(500), allowNull: true },
    refresh_token: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "oauth_accounts",
    timestamps: false
  }
);
