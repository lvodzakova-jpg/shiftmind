import type { BranchSettings } from "./types";

export const BRANCH_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type BranchDay = (typeof BRANCH_DAYS)[number];

export const DEFAULT_BRANCH_SETTINGS: Omit<BranchSettings, "id" | "updated_at"> = {
  branch_name: "Kaviareň Centrum",
  min_staff_per_shift: 2,
  monday_open: "07:00",
  monday_close: "22:00",
  tuesday_open: "07:00",
  tuesday_close: "22:00",
  wednesday_open: "07:00",
  wednesday_close: "22:00",
  thursday_open: "07:00",
  thursday_close: "22:00",
  friday_open: "07:00",
  friday_close: "22:00",
  saturday_open: "08:00",
  saturday_close: "20:00",
  sunday_open: "08:00",
  sunday_close: "20:00",
};

export function branchDayOpenKey(day: BranchDay): `${BranchDay}_open` {
  return `${day}_open`;
}

export function branchDayCloseKey(day: BranchDay): `${BranchDay}_close` {
  return `${day}_close`;
}

export function formatBranchHours(open: string, close: string): string {
  return `${open.slice(0, 5)}–${close.slice(0, 5)}`;
}
