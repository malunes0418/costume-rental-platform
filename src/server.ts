import { app } from "./app";
import { env } from "./config/env";
import { runMigrations } from "./helpers/runMigrations";
import { db } from "./models";

async function bootstrap() {
  await db.sequelize.authenticate();
  await runMigrations();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

bootstrap().catch(console.error);
