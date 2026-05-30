import { hoursBetweenTimes } from "./time";
import type { Employee, Shift, TimeLog } from "./types";

export interface WeeklyHoursSummary {
  employeeId: string;
  name: string;
  scheduledHours: number;
  maxHours: number;
  excess: number;
}

export function getScheduledWeeklyHours(
  employeeId: string,
  shifts: Shift[]
): number {
  return shifts
    .filter((s) => s.employee_id === employeeId)
    .reduce((sum, s) => sum + hoursBetweenTimes(s.start_time, s.end_time), 0);
}

export function getWeeklyHoursSummaries(
  employees: Employee[],
  shifts: Shift[]
): WeeklyHoursSummary[] {
  return employees
    .map((emp) => {
      const scheduledHours = getScheduledWeeklyHours(emp.id, shifts);
      const excess = scheduledHours - emp.max_hours_per_week;
      return {
        employeeId: emp.id,
        name: emp.name,
        scheduledHours: Math.round(scheduledHours * 100) / 100,
        maxHours: emp.max_hours_per_week,
        excess: Math.round(excess * 100) / 100,
      };
    })
    .filter((s) => s.excess > 0)
    .sort((a, b) => b.excess - a.excess);
}

export function isOverWeeklyLimit(
  employee: Employee,
  scheduledHours: number
): boolean {
  return scheduledHours > employee.max_hours_per_week;
}

export function getTotalLoggedOvertime(timeLogs: TimeLog[]): number {
  return timeLogs.reduce((sum, log) => sum + (log.overtime_hours ?? 0), 0);
}

export function getEmployeeLoggedOvertime(
  employeeId: string,
  timeLogs: TimeLog[]
): number {
  return timeLogs
    .filter((log) => log.employee_id === employeeId)
    .reduce((sum, log) => sum + (log.overtime_hours ?? 0), 0);
}
