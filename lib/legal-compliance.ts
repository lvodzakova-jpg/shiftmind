import { hoursBetweenTimes } from "./time";
import type { Employee, LegalCountry, LegalViolation, Shift } from "./types";
import { getScheduledWeeklyHours } from "./overtime";
import { getWeekDates } from "./week";

export interface LegalRules {
  minRestHours: number;
  maxShiftHours: number;
  maxWeeklyHours: number;
  breakAfterHours: number;
  breakMinutes: number;
}

export const LEGAL_RULES: Record<LegalCountry, LegalRules> = {
  sk: {
    minRestHours: 11,
    maxShiftHours: 12,
    maxWeeklyHours: 48,
    breakAfterHours: 6,
    breakMinutes: 30,
  },
  es: {
    minRestHours: 12,
    maxShiftHours: 9,
    maxWeeklyHours: 40,
    breakAfterHours: 6,
    breakMinutes: 15,
  },
};

function shiftEndDateTime(date: string, endTime: string): Date {
  const [h, m] = endTime.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function shiftStartDateTime(date: string, startTime: string): Date {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export function checkLegalCompliance(
  employees: Employee[],
  shifts: Shift[],
  weekStart: string,
  country: LegalCountry = "sk"
): LegalViolation[] {
  const rules = LEGAL_RULES[country];
  const violations: LegalViolation[] = [];
  const weekDates = getWeekDates(weekStart);
  const empMap = new Map(employees.map((e) => [e.id, e]));

  for (const emp of employees) {
    const empShifts = shifts
      .filter(
        (s) =>
          s.employee_id === emp.id &&
          weekDates.includes(s.date) &&
          s.shift_type !== "off"
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const weeklyHours = getScheduledWeeklyHours(emp.id, shifts);
    if (weeklyHours > rules.maxWeeklyHours) {
      violations.push({
        id: `${emp.id}-weekly`,
        employeeId: emp.id,
        employeeName: emp.name,
        rule: "max_weekly_hours",
        message: `max_weekly_hours:${weeklyHours}:${rules.maxWeeklyHours}`,
      });
    }

    for (const shift of empShifts) {
      const hours = hoursBetweenTimes(shift.start_time, shift.end_time);
      if (hours > rules.maxShiftHours) {
        violations.push({
          id: `${shift.id}-length`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: shift.date,
          rule: "max_shift_hours",
          message: `max_shift_hours:${hours}:${rules.maxShiftHours}`,
        });
      }
      if (hours > rules.breakAfterHours) {
        violations.push({
          id: `${shift.id}-break`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: shift.date,
          rule: "mandatory_break",
          message: `mandatory_break:${rules.breakMinutes}`,
        });
      }
    }

    for (let i = 1; i < empShifts.length; i++) {
      const prev = empShifts[i - 1];
      const curr = empShifts[i];
      const prevEnd = shiftEndDateTime(prev.date, prev.end_time);
      const currStart = shiftStartDateTime(curr.date, curr.start_time);
      const restHours = (currStart.getTime() - prevEnd.getTime()) / 3600000;
      if (restHours < rules.minRestHours) {
        violations.push({
          id: `${emp.id}-rest-${curr.date}`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: curr.date,
          rule: "min_rest",
          message: `min_rest:${restHours.toFixed(1)}:${rules.minRestHours}`,
        });
      }
    }
  }

  for (const shift of shifts) {
    if (!empMap.has(shift.employee_id)) continue;
  }

  return violations;
}

export function formatLegalViolation(
  t: (key: string, params?: Record<string, string | number>) => string,
  violation: LegalViolation
): string {
  const [rule, ...rest] = violation.message.split(":");
  switch (rule) {
    case "max_weekly_hours":
      return t("legal.maxWeekly", {
        name: violation.employeeName,
        hours: rest[0],
        max: rest[1],
      });
    case "max_shift_hours":
      return t("legal.maxShift", {
        name: violation.employeeName,
        date: violation.date ?? "",
        hours: rest[0],
        max: rest[1],
      });
    case "mandatory_break":
      return t("legal.mandatoryBreak", {
        name: violation.employeeName,
        date: violation.date ?? "",
        minutes: rest[0],
      });
    case "min_rest":
      return t("legal.minRest", {
        name: violation.employeeName,
        date: violation.date ?? "",
        hours: rest[0],
        min: rest[1],
      });
    default:
      return violation.message;
  }
}
