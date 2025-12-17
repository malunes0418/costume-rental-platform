import { app } from "./app";
import { db } from "./models";
import { env } from "./config/env";

async function bootstrap() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully');
    
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
