export const MIN_REMINDER_INTERVAL_MINUTES = 15;
export const MAX_REMINDER_INTERVAL_MINUTES = 480;

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
