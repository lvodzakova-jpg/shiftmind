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
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-200",
  },
  evening: {
    bg: "bg-indigo-100",
    text: "text-indigo-900",
    border: "border-indigo-200",
  },
  full: {
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-200",
  },
  off: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  sick: {
    bg: "bg-rose-100",
    text: "text-rose-900",
    border: "border-rose-200",
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
