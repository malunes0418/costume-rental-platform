import { app } from "./app";
import { db } from "./models";
import { env } from "./config/env";

async function bootstrap() {
  await db.sequelize.authenticate();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

bootstrap().catch(console.error);
