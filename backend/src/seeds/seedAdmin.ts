import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const seedAdmin = async () => {
  await connectDatabase();

  const existing = await User.findOne({ email: 'admin@company.com' });
  if (existing) {
    if (!existing.isVerified) {
      existing.isVerified = true;
      existing.phoneNormalized = existing.phoneNormalized || '9999999999';
      await existing.save();
      logger.info('Admin verification flag updated.');
    } else {
      logger.info('Admin already exists. Skipping seed.');
    }
    process.exit(0);
  }

  await User.create({
    employeeId: 'ADMIN001',
    fullName: 'Super Admin',
    email: 'admin@company.com',
    phone: '9999999999',
    phoneNormalized: '9999999999',
    password: 'Admin@123',
    department: 'Administration',
    designation: 'System Administrator',
    joiningDate: new Date(),
    role: 'admin',
    status: 'active',
    isVerified: true,
    address: 'Head Office',
  });

  logger.info('Default admin created successfully');
  logger.info('Email: admin@company.com');
  logger.info('Password: Admin@123');
  process.exit(0);
};

seedAdmin().catch((error) => {
  logger.error('Seed failed', error);
  process.exit(1);
});
