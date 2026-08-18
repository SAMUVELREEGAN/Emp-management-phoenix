import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { clearDemoData } from './seeds/clearDemoData';
import { ensureDefaultAdmin } from './seeds/ensureDefaultAdmin';
import { ensureOfficeSettingsDocument } from './services/officeSettingsService';
import { startHourlyReportReminderScheduler } from './services/hourlyReportReminderService';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDatabase();

  if (env.RESET_DEMO_DATA) {
    logger.warn('RESET_DEMO_DATA=true — clearing demo data (keep admin only)');
    await clearDemoData();
    await ensureOfficeSettingsDocument();
    logger.warn('Remove RESET_DEMO_DATA from Render after this deploy finishes');
  } else {
    await ensureDefaultAdmin();
    await ensureOfficeSettingsDocument();
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      `Server running on http://0.0.0.0:${env.PORT} [${env.NODE_ENV}]`,
    );
    startHourlyReportReminderScheduler();
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
