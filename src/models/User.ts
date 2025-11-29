import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface UserAttributes {
  id: number;
  email: string;
  password_hash?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  role: "USER" | "ADMIN";
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role"> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password_hash!: string | null;
  public name!: string | null;
  public avatar_url!: string | null;
  public role!: "USER" | "ADMIN";
  public created_at!: Date;
  public updated_at!: Date;
}

User.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    role: { type: DataTypes.ENUM("USER", "ADMIN"), allowNull: false, defaultValue: "USER" },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: "users",
    timestamps: false
  }
);
