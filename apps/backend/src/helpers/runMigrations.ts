import path from "path";
import type { QueryInterface } from "sequelize";
import { Sequelize } from "sequelize";
import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "../config/db";

type SequelizeCliMigration = {
  up: (queryInterface: QueryInterface, sequelizeModule: typeof Sequelize) => Promise<void>;
  down?: (queryInterface: QueryInterface, sequelizeModule: typeof Sequelize) => Promise<void>;
};

export function createMigrator(): Umzug {
  const migrationsGlob = path.join(__dirname, "..", "..", "migrations", "*.js").replace(/\\/g, "/");

  return new Umzug({
    migrations: {
      glob: migrationsGlob,
      resolve: ({ name, path: filepath }) => {
        if (!filepath) {
          throw new Error(`Migration "${name}" has no filesystem path`);
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(filepath) as SequelizeCliMigration;
        const queryInterface = sequelize.getQueryInterface();
        return {
          name,
          up: async () => mod.up(queryInterface, Sequelize),
          down: async () => mod.down?.(queryInterface, Sequelize)
        };
      }
    },
    storage: new SequelizeStorage({ sequelize }),
    logger: console
  });
}

export async function runMigrations(): Promise<void> {
  await createMigrator().up();
}
