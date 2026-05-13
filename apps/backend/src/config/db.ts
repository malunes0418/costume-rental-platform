import { Sequelize } from "sequelize";
import { env } from "./env";
import * as fs from "fs";

const dialectOptions: any = {};
if (env.dbCaCertPath) {
  dialectOptions.ssl = {
    ca: fs.readFileSync(env.dbCaCertPath),
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  };
} else if (env.dbHost && !env.dbHost.includes('localhost') && !env.dbHost.includes('127.0.0.1')) {
  // Fallback for remote DBs (like TiDB Serverless) if the path isn't set
  dialectOptions.ssl = {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  };
}

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: "mysql",
  logging: false,
  dialectOptions
});
