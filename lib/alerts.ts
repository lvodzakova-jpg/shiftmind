import {
  countFilledPreferenceDays,
  hasCompletePreferences,
} from "./preferences";
import { isWorkingShift } from "./shifts";
import type { Employee, Preference, Shift } from "./types";
import { getDayNames, translate, type Locale } from "./i18n";
import { getWeekDates } from "./week";

export interface Alert {
  id: string;
  type: "warning" | "info" | "error";
  message: string;
}

const DEFAULT_MIN_STAFF = 2;

export function buildAlerts(
  locale: Locale,
  employees: Employee[],
  shifts: Shift[],
  preferences: Preference[],
  weekStart: string,
  minStaffPerDay = DEFAULT_MIN_STAFF
): Alert[] {
  const alerts: Alert[] = [];
  const dates = getWeekDates(weekStart);
  const dayNames = getDayNames(locale);
  const employeeIds = new Set(employees.map((e) => e.id));
  const prefsByEmployee = new Map<string, Preference>();

  for (const p of preferences) {
    prefsByEmployee.set(p.employee_id, p);
  }

  const employeesWithoutPrefs = employees.filter(
    (e) => !hasCompletePreferences(prefsByEmployee.get(e.id))
  );
  if (employeesWithoutPrefs.length > 0) {
    alerts.push({
      id: "missing-prefs",
      type: "warning",
      message: translate(locale, "alerts.missingPrefs", {
        count: employeesWithoutPrefs.length,
      }),
    });
  }

  if (employees.length === 0) {
    alerts.push({
      id: "no-staff",
      type: "error",
      message: translate(locale, "alerts.noStaff"),
    });
    return alerts;
  }

  dates.forEach((date, dayIndex) => {
    const working = shifts.filter(
      (s) => s.date === date && isWorkingShift(s.shift_type)
    );
    if (working.length < minStaffPerDay) {
      alerts.push({
        id: `understaffed-${date}`,
        type: "warning",
        message: translate(locale, "alerts.understaffed", {
          day: dayNames[dayIndex],
          date,
          count: working.length,
          min: minStaffPerDay,
        }),
      });
    }
  });

  const hasAnyShift = shifts.some((s) => employeeIds.has(s.employee_id));
  if (!hasAnyShift && employees.length > 0) {
    alerts.push({
      id: "empty-schedule",
      type: "info",
      message: translate(locale, "alerts.emptySchedule"),
    });
  }

  const sickCount = shifts.filter((s) => s.shift_type === "sick").length;
  if (sickCount > 0) {
    alerts.push({
      id: "sick-leave",
      type: "info",
      message: translate(locale, "alerts.sickLeave", { count: sickCount }),
    });
  }

  return alerts;
}
