import { getScheduledWeeklyHours, getTotalLoggedOvertime } from "./overtime";
import type { Employee, Shift, TimeLog } from "./types";

export interface KpiMetrics {
  totalLaborCost: number;
  weeklyBudget: number;
  budgetUsedPercent: number;
  attendanceRate: number;
  overtimePercent: number;
  totalScheduledHours: number;
  totalActualHours: number;
}

export interface WeekComparison {
  label: string;
  scheduledHours: number;
  actualHours: number;
  laborCost: number;
}

export interface DailyLaborCost {
  date: string;
  scheduledHours: number;
  actualHours: number;
  laborCost: number;
}

export interface RoleLaborCost {
  role: string;
  scheduledHours: number;
  laborCost: number;
  headcount: number;
}

export function computeKpis(
  employees: Employee[],
  shifts: Shift[],
  timeLogs: TimeLog[],
  weeklyBudget: number
): KpiMetrics {
  let totalLaborCost = 0;
  let totalScheduledHours = 0;
  let totalActualHours = 0;

  for (const emp of employees) {
    const scheduled = getScheduledWeeklyHours(emp.id, shifts);
    totalScheduledHours += scheduled;
    totalLaborCost += scheduled * emp.hourly_rate;

    const empLogs = timeLogs.filter((l) => l.employee_id === emp.id);
    const actual = empLogs.reduce((s, l) => s + (l.actual_hours ?? 0), 0);
    totalActualHours += actual;
    const overtime = empLogs.reduce((s, l) => s + (l.overtime_hours ?? 0), 0);
    totalLaborCost += overtime * emp.hourly_rate * 0.5;
  }

  const workingShifts = shifts.filter((s) => s.shift_type !== "off" && s.shift_type !== "sick");
  const clockedEmployees = new Set(
    timeLogs.filter((l) => l.clock_out).map((l) => l.employee_id)
  );
  const attendanceRate =
    workingShifts.length > 0
      ? Math.round((clockedEmployees.size / new Set(workingShifts.map((s) => s.employee_id)).size) * 100)
      : 0;

  const loggedOvertime = getTotalLoggedOvertime(timeLogs);
  const overtimePercent =
    totalActualHours > 0
      ? Math.round((loggedOvertime / totalActualHours) * 100)
      : 0;

  const budgetUsedPercent =
    weeklyBudget > 0 ? Math.round((totalLaborCost / weeklyBudget) * 100) : 0;

  return {
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    weeklyBudget,
    budgetUsedPercent,
    attendanceRate,
    overtimePercent,
    totalScheduledHours: Math.round(totalScheduledHours * 100) / 100,
    totalActualHours: Math.round(totalActualHours * 100) / 100,
  };
}

export function computeWeekComparison(
  employees: Employee[],
  currentShifts: Shift[],
  currentLogs: TimeLog[],
  prevShifts: Shift[],
  prevLogs: TimeLog[]
): WeekComparison[] {
  function weekTotals(shifts: Shift[], logs: TimeLog[]): Omit<WeekComparison, "label"> {
    let scheduledHours = 0;
    let actualHours = 0;
    let laborCost = 0;
    for (const emp of employees) {
      scheduledHours += getScheduledWeeklyHours(emp.id, shifts);
      const empLogs = logs.filter((l) => l.employee_id === emp.id);
      const act = empLogs.reduce((s, l) => s + (l.actual_hours ?? 0), 0);
      actualHours += act;
      laborCost += getScheduledWeeklyHours(emp.id, shifts) * emp.hourly_rate;
    }
    return { scheduledHours, actualHours, laborCost };
  }

  const current = weekTotals(currentShifts, currentLogs);
  const prev = weekTotals(prevShifts, prevLogs);

  return [
    { label: "prev", ...prev },
    { label: "current", ...current },
  ];
}

function shiftHours(shift: Shift): number {
  if (shift.shift_type === "off" || shift.shift_type === "sick") return 0;
  const [sh, sm] = shift.start_time.split(":").map(Number);
  const [eh, em] = shift.end_time.split(":").map(Number);
  return Math.max(0, eh + em / 60 - (sh + sm / 60));
}

export function computeDailyLaborCosts(
  employees: Employee[],
  shifts: Shift[],
  timeLogs: TimeLog[],
  weekDates: string[]
): DailyLaborCost[] {
  const rateMap = new Map(employees.map((e) => [e.id, e.hourly_rate]));

  return weekDates.map((date) => {
    const dayShifts = shifts.filter(
      (s) => s.date === date && s.shift_type !== "off" && s.shift_type !== "sick"
    );
    let scheduledHours = 0;
    let laborCost = 0;
    for (const s of dayShifts) {
      const h = shiftHours(s);
      scheduledHours += h;
      laborCost += h * (rateMap.get(s.employee_id) ?? 0);
    }

    const dayLogs = timeLogs.filter((l) => l.clock_in.startsWith(date));
    const actualHours = dayLogs.reduce((sum, l) => sum + (l.actual_hours ?? 0), 0);
    const overtimeCost = dayLogs.reduce(
      (sum, l) => sum + (l.overtime_hours ?? 0) * (rateMap.get(l.employee_id) ?? 0) * 0.5,
      0
    );

    return {
      date,
      scheduledHours: Math.round(scheduledHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      laborCost: Math.round((laborCost + overtimeCost) * 100) / 100,
    };
  });
}

export function computeCostByRole(
  employees: Employee[],
  shifts: Shift[]
): RoleLaborCost[] {
  const byRole = new Map<string, RoleLaborCost>();

  for (const emp of employees) {
    const role = emp.role;
    const entry = byRole.get(role) ?? {
      role,
      scheduledHours: 0,
      laborCost: 0,
      headcount: 0,
    };
    entry.headcount++;
    const hours = getScheduledWeeklyHours(emp.id, shifts);
    entry.scheduledHours += hours;
    entry.laborCost += hours * emp.hourly_rate;
    byRole.set(role, entry);
  }

  return [...byRole.values()].map((r) => ({
    ...r,
    scheduledHours: Math.round(r.scheduledHours * 100) / 100,
    laborCost: Math.round(r.laborCost * 100) / 100,
  }));
}

export function computeProjectedWeekCost(
  dailyCosts: DailyLaborCost[],
  weeklyBudget: number
): { projected: number; onTrack: boolean } {
  const total = dailyCosts.reduce((s, d) => s + d.laborCost, 0);
  const daysWithCost = dailyCosts.filter((d) => d.laborCost > 0).length;
  const projected =
    daysWithCost > 0
      ? Math.round((total / daysWithCost) * dailyCosts.length * 100) / 100
      : total;
  return {
    projected,
    onTrack: weeklyBudget <= 0 || projected <= weeklyBudget,
  };
}
