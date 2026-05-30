const STEP = 0.5;

export function isValidMaxHoursPerWeek(value: number): boolean {
  if (!Number.isFinite(value) || value < 1 || value > 60) return false;
  const steps = value / STEP;
  return Math.abs(steps - Math.round(steps)) < 0.001;
}

export function formatMaxHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
