import type { AvailabilityType } from "./types";

export const PREF_DAY_COLUMNS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type PrefDayColumn = (typeof PREF_DAY_COLUMNS)[number];

export const PREF_DAY_SELECT = PREF_DAY_COLUMNS.join(", ");

export function getPrefDayColumn(dayIndex: number): PrefDayColumn {
  return PREF_DAY_COLUMNS[dayIndex];
}

export function getPreferenceDayValue(
  pref: Record<PrefDayColumn, AvailabilityType | null | undefined>,
  dayIndex: number
): AvailabilityType | undefined {
  return pref[getPrefDayColumn(dayIndex)] ?? undefined;
}

export function countFilledPreferenceDays(
  pref: Record<PrefDayColumn, AvailabilityType | null | undefined> | undefined
): number {
  if (!pref) return 0;
  return PREF_DAY_COLUMNS.filter((col) => pref[col] != null).length;
}

export function hasCompletePreferences(
  pref: Record<PrefDayColumn, AvailabilityType | null | undefined> | undefined
): boolean {
  return countFilledPreferenceDays(pref) >= 7;
}

export function buildPreferenceRow(
  employeeId: string,
  values: AvailabilityType[]
): Record<string, string> {
  const row: Record<string, string> = { employee_id: employeeId };
  PREF_DAY_COLUMNS.forEach((col, i) => {
    row[col] = values[i] ?? "off";
  });
  return row;
}

export function preferenceToDayEntries(
  pref: Record<string, unknown> & { employee_id: string }
): Array<{ dayIndex: number; availability: AvailabilityType }> {
  return PREF_DAY_COLUMNS.map((col, dayIndex) => ({
    dayIndex,
    availability: (pref[col] as AvailabilityType) ?? "off",
  }));
}
