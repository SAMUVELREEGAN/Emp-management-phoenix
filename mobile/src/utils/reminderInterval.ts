export const MIN_REMINDER_INTERVAL_MINUTES = 15;
export const MAX_REMINDER_INTERVAL_MINUTES = 480;

export type ReminderIntervalUnit = 'minutes' | 'hours';

export function normalizeReminderIntervalMinutes(
  value?: number | null,
  legacyHours?: number | null,
): number {
  if (value != null && Number.isFinite(value) && value > 0) {
    return Math.min(
      MAX_REMINDER_INTERVAL_MINUTES,
      Math.max(MIN_REMINDER_INTERVAL_MINUTES, Math.round(value)),
    );
  }

  if (legacyHours === 2) {
    return 120;
  }

  return 60;
}

export function formatReminderIntervalLabel(totalMinutes: number): string {
  const minutes = normalizeReminderIntervalMinutes(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${
      remainingMinutes === 1 ? '' : 's'
    }`;
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function minutesToDisplayValue(totalMinutes: number): {
  value: string;
  unit: ReminderIntervalUnit;
} {
  const minutes = normalizeReminderIntervalMinutes(totalMinutes);

  if (minutes >= 60 && minutes % 60 === 0) {
    return { value: String(minutes / 60), unit: 'hours' };
  }

  return { value: String(minutes), unit: 'minutes' };
}

export function displayValueToMinutes(
  value: string,
  unit: ReminderIntervalUnit,
): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  const minutes =
    unit === 'hours' ? Math.round(parsed * 60) : Math.round(parsed);

  if (minutes < MIN_REMINDER_INTERVAL_MINUTES) {
    return null;
  }

  if (minutes > MAX_REMINDER_INTERVAL_MINUTES) {
    return null;
  }

  return minutes;
}

export function getReminderIntervalHint(unit: ReminderIntervalUnit): string {
  if (unit === 'hours') {
    return `Enter hours (0.25 to ${MAX_REMINDER_INTERVAL_MINUTES / 60} hours)`;
  }

  return `Enter minutes (${MIN_REMINDER_INTERVAL_MINUTES} to ${MAX_REMINDER_INTERVAL_MINUTES})`;
}
