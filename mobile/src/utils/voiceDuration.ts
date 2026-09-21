export function formatVoiceDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function formatVoiceDurationMs(totalMs: number): string {
  return formatVoiceDuration(Math.floor(totalMs / 1000));
}
