import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { ensureDefaultAdmin } from './seeds/ensureDefaultAdmin';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDatabase();
  await ensureDefaultAdmin();

  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      `Server running on http://0.0.0.0:${env.PORT} [${env.NODE_ENV}]`,
    );
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
