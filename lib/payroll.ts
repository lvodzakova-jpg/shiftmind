import { countLeaveDays } from "./leaves";
import { getScheduledWeeklyHours } from "./overtime";
import type { Employee, LeaveRequest, Shift, TimeLog } from "./types";

export interface PayrollRow {
  employeeId: string;
  name: string;
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;
  absenceDays: number;
  mealAllowance: number;
  laborCost: number;
}

export function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function buildPayrollRows(
  employees: Employee[],
  shifts: Shift[],
  timeLogs: TimeLog[],
  leaveRequests: LeaveRequest[],
  mealAllowance: number,
  year: number,
  month: number
): PayrollRow[] {
  const { start, end } = getMonthRange(year, month);

  return employees.map((emp) => {
    const monthShifts = shifts.filter(
      (s) =>
        s.employee_id === emp.id &&
        s.date >= start &&
        s.date <= end &&
        s.shift_type !== "off"
    );
    const scheduledHours = monthShifts.reduce(
      (sum, s) =>
        sum +
        (s.end_time > s.start_time
          ? parseTimeHours(s.start_time, s.end_time)
          : 0),
      0
    );

    const monthLogs = timeLogs.filter(
      (log) =>
        log.employee_id === emp.id &&
        log.clock_in >= `${start}T00:00:00` &&
        log.clock_in <= `${end}T23:59:59`
    );
    const actualHours = monthLogs.reduce(
      (sum, log) => sum + (log.actual_hours ?? 0),
      0
    );
    const overtimeHours = monthLogs.reduce(
      (sum, log) => sum + (log.overtime_hours ?? 0),
      0
    );

    const approvedLeaves = leaveRequests.filter(
      (lr) =>
        lr.employee_id === emp.id &&
        lr.status === "approved" &&
        lr.start_date <= end &&
        lr.end_date >= start
    );
    const absenceDays = approvedLeaves.reduce(
      (sum, lr) => sum + countLeaveDays(lr.start_date, lr.end_date),
      0
    );

    const workDays = new Set(
      monthLogs.filter((l) => l.clock_out).map((l) => l.clock_in.slice(0, 10))
    ).size;
    const mealTotal = workDays * mealAllowance;
    const laborCost =
      actualHours * emp.hourly_rate + overtimeHours * emp.hourly_rate * 1.5;

    return {
      employeeId: emp.id,
      name: emp.name,
      scheduledHours: round2(scheduledHours),
      actualHours: round2(actualHours),
      overtimeHours: round2(overtimeHours),
      absenceDays,
      mealAllowance: round2(mealTotal),
      laborCost: round2(laborCost + mealTotal),
    };
  });
}

function parseTimeHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh + em / 60 - (sh + sm / 60);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function payrollToCsv(rows: PayrollRow[]): string {
  const header =
    "employee_id,name,scheduled_hours,actual_hours,overtime_hours,absence_days,meal_allowance,labor_cost";
  const lines = rows.map(
    (r) =>
      `${r.employeeId},${escapeCsv(r.name)},${r.scheduledHours},${r.actualHours},${r.overtimeHours},${r.absenceDays},${r.mealAllowance},${r.laborCost}`
  );
  return [header, ...lines].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
