import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { clearDemoData } from './clearDemoData';

const resetDemoData = async () => {
  await connectDatabase();
  await clearDemoData();
  process.exit(0);
};

resetDemoData().catch((error) => {
  logger.error('Demo data reset failed', error);
  process.exit(1);
});
