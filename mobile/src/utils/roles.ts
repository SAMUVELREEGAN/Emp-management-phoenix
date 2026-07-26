import type { UserRole } from '../types';

export function canManageStaff(role?: UserRole): boolean {
  return role === 'admin';
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'hr':
      return 'HR Manager';
    default:
      return 'Employee';
  }
}
