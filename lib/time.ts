/** Parse HH:MM or HH:MM:SS to minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

/** Hours between two time strings (e.g. "07:00", "15:00"). */
export function hoursBetweenTimes(start: string, end: string): number {
  const diff = parseTimeToMinutes(end) - parseTimeToMinutes(start);
  return Math.round((diff / 60) * 100) / 100;
}

/** Hours between ISO timestamps. */
export function hoursBetweenTimestamps(
  clockIn: string,
  clockOut: Date
): number {
  const ms = clockOut.getTime() - new Date(clockIn).getTime();
  if (ms <= 0) return 0;
  return Math.round((ms / 3_600_000) * 100) / 100;
}

/** True if actual hours exceed scheduled by more than 15 minutes. */
export function exceedsScheduledBy15Min(
  actualHours: number,
  scheduledHours: number
): boolean {
  return scheduledHours > 0 && actualHours > scheduledHours + 0.25;
}
