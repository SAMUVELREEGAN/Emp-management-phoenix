import type { Shift } from '../types';
import { formatOfficeTime12Hour } from './dates';

export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export function formatWorkingDays(days: number[]): string {
  if (!days.length) {
    return '-';
  }

  const labels = WEEKDAY_OPTIONS.filter(option => days.includes(option.value)).map(
    option => option.label,
  );

  return labels.join(', ');
}

export function formatShiftWindow(shift: Pick<Shift, 'startTime' | 'endTime'>): string {
  return `${formatOfficeTime12Hour(shift.startTime)} - ${formatOfficeTime12Hour(shift.endTime)}`;
}

export function getShiftName(shift: Shift | string | undefined): string {
  if (!shift || typeof shift === 'string') {
    return 'Shift';
  }
  return shift.name;
}

export function getShiftCode(shift: Shift | string | undefined): string {
  if (!shift || typeof shift === 'string') {
    return '';
  }
  return shift.code;
}

export function toDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
