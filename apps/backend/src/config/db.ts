import { Sequelize } from "sequelize";
import { env } from "./env";
import * as fs from "fs";

const dialectOptions: any = {};
if (env.dbCaCertPath) {
  dialectOptions.ssl = {
    ca: fs.readFileSync(env.dbCaCertPath)
  };
}

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: "mysql",
  logging: false,
  dialectOptions
});
