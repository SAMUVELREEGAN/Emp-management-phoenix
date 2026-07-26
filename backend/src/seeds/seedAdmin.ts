import { connectDatabase } from '../config/database';
import { ensureDefaultAdmin } from './ensureDefaultAdmin';
import { logger } from '../utils/logger';

const seedAdmin = async () => {
  await connectDatabase();
  await ensureDefaultAdmin();
  process.exit(0);
};

seedAdmin().catch((error) => {
  logger.error('Seed failed', error);
  process.exit(1);
});
