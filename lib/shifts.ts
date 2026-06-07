import type { AvailabilityType, ShiftType } from "./types";

export const SHIFT_TIMES: Record<ShiftType, string> = {
  morning: "7:00–15:00",
  evening: "14:00–22:00",
  full: "7:00–19:00",
  off: "—",
  sick: "—",
};

export const SHIFT_STYLES: Record<
  ShiftType,
  { bg: string; text: string; border: string }
> = {
  morning: {
    bg: "bg-subtle",
    text: "text-foreground",
    border: "border-default",
  },
  evening: {
    bg: "bg-subtle",
    text: "text-foreground",
    border: "border-default",
  },
  full: {
    bg: "bg-brand",
    text: "text-on-brand",
    border: "border-brand",
  },
  off: {
    bg: "bg-subtle",
    text: "text-muted",
    border: "border-default",
  },
  sick: {
    bg: "bg-subtle",
    text: "text-foreground",
    border: "border-default",
  },
};

export const WORKING_SHIFTS: ShiftType[] = ["morning", "evening", "full"];

/** Times stored in the shifts table (PostgreSQL time format). */
export const SHIFT_DB_TIMES: Record<
  ShiftType,
  { start_time: string; end_time: string }
> = {
  morning: { start_time: "07:00", end_time: "15:00" },
  evening: { start_time: "14:00", end_time: "22:00" },
  full: { start_time: "07:00", end_time: "19:00" },
  off: { start_time: "00:00", end_time: "00:00" },
  sick: { start_time: "00:00", end_time: "00:00" },
};

export function isStorableShift(type: ShiftType): boolean {
  return type !== "off" && type !== "sick";
}

export function getShiftDbTimes(type: ShiftType) {
  return SHIFT_DB_TIMES[type];
}

export const AVAILABILITY_OPTIONS: AvailabilityType[] = [
  "morning",
  "evening",
  "full",
  "off",
  "unavailable",
];

export function isWorkingShift(type: ShiftType): boolean {
  return WORKING_SHIFTS.includes(type);
}
