import { User } from '../models/User';
import { logger } from '../utils/logger';

export const ensureDefaultAdmin = async (): Promise<void> => {
  const existing = await User.findOne({ email: 'admin@company.com' });
  if (existing) {
    if (!existing.isVerified) {
      existing.isVerified = true;
      existing.phoneNormalized = existing.phoneNormalized || '9999999999';
      await existing.save();
      logger.info('Default admin verification flag updated.');
    }
    return;
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

  logger.info('Default admin created: admin@company.com / Admin@123');
};
