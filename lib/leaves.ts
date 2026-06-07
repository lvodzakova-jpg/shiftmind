import type { LeaveRequest, LeaveType } from "./types";
import { formatDateISO, parseISODate } from "./week";

export const LEAVE_TYPES: LeaveType[] = [
  "paid",
  "sick",
  "unpaid",
  "bank_holiday",
  "rtt",
];

export function countLeaveDays(startDate: string, endDate: string): number {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    count++;
  }
  return count;
}

export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDateISO(new Date(d)));
  }
  return dates;
}

export function getApprovedLeaveDates(
  requests: LeaveRequest[],
  employeeId?: string
): Set<string> {
  const blocked = new Set<string>();
  for (const req of requests) {
    if (req.status !== "approved") continue;
    if (employeeId && req.employee_id !== employeeId) continue;
    for (const date of getDateRange(req.start_date, req.end_date)) {
      blocked.add(`${req.employee_id}:${date}`);
    }
  }
  return blocked;
}

export function leaveTypeToShiftType(type: LeaveType): "off" | "sick" {
  return type === "sick" ? "sick" : "off";
}
