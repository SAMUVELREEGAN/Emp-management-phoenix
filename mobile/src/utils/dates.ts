export function formatDate(value?: string | Date | null): string {
  if (!value) {
    return '-';
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(value?: string | Date | null): string {
  if (!value) {
    return '-';
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) {
    return '-';
  }
  return `${formatDate(value)} ${formatTime(value)}`;
}

export function formatWorkingHours(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return '0h 0m';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatLateDuration(lateMinutes?: number | null): string {
  if (!lateMinutes || lateMinutes <= 0) {
    return '';
  }
  const hours = Math.floor(lateMinutes / 60);
  const mins = lateMinutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getMinutesFromDate(value: Date = new Date()): number {
  return value.getHours() * 60 + value.getMinutes();
}

export function isBeforeOfficeEnd(officeEndTime: string, value: Date = new Date()): boolean {
  return getMinutesFromDate(value) < parseTimeToMinutes(officeEndTime);
}

export function formatOfficeTime(time: string): string {
  return formatOfficeTime12Hour(time);
}

export function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  return date;
}

export function dateToTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export type TimePeriod = 'AM' | 'PM';

export interface TimeParts12Hour {
  hour12: number;
  minute: number;
  period: TimePeriod;
}

export function timeStringToParts(time: string): TimeParts12Hour {
  const [hours24, minute] = time.split(':').map(Number);
  const safeHour = Number.isNaN(hours24) ? 0 : hours24;
  const safeMinute = Number.isNaN(minute) ? 0 : minute;
  const period: TimePeriod = safeHour >= 12 ? 'PM' : 'AM';
  let hour12 = safeHour % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  return { hour12, minute: safeMinute, period };
}

export function partsToTimeString(
  hour12: number,
  minute: number,
  period: TimePeriod,
): string {
  let hours24 = hour12 % 12;
  if (period === 'PM') {
    hours24 += 12;
  }
  return `${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatOfficeTime12Hour(time: string): string {
  const { hour12, minute, period } = timeStringToParts(time);
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export function toDateInputValue(value?: string | Date | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function dateInputToParts(dateValue: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateValue.split('-').map(Number);
  return {
    year: Number.isNaN(year) ? new Date().getFullYear() : year,
    month: Number.isNaN(month) ? new Date().getMonth() + 1 : month,
    day: Number.isNaN(day) ? new Date().getDate() : day,
  };
}

export function partsToDateInput(year: number, month: number, day: number): string {
  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), maxDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function getMonthLabel(month: number): string {
  return MONTH_LABELS[month - 1] || MONTH_LABELS[0];
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildYearOptions(range = 3): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range * 2 + 1 }, (_, index) => currentYear - range + index);
}

export function getMonthStartDateInput(value?: string | Date | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return partsToDateInput(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return partsToDateInput(date.getFullYear(), date.getMonth() + 1, 1);
}

export function getPreviousMonthRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastDay = getDaysInMonth(year, month);
  return {
    fromDate: partsToDateInput(year, month, 1),
    toDate: partsToDateInput(year, month, lastDay),
  };
}

export function toIsoDateTime(): string {
  return new Date().toISOString();
}

export function calculateLeaveDuration(
  leaveType: 'full_day' | 'half_day',
  fromDate: string,
  toDate: string,
  halfDayHours?: number,
): { totalDays: number; label: string } {
  if (leaveType === 'half_day') {
    const hours = halfDayHours && halfDayHours > 0 ? halfDayHours : 4;
    return {
      totalDays: 0.5,
      label: `${hours} hour${hours === 1 ? '' : 's'} (Half Day)`,
    };
  }

  const fromParts = dateInputToParts(fromDate);
  const toParts = dateInputToParts(toDate);
  const from = new Date(fromParts.year, fromParts.month - 1, fromParts.day);
  const to = new Date(toParts.year, toParts.month - 1, toParts.day);
  const diffMs = to.getTime() - from.getTime();
  const totalDays = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1, 1);

  return {
    totalDays,
    label: `${totalDays} day${totalDays === 1 ? '' : 's'}`,
  };
}
