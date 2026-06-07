import { getShiftDbTimes } from "./shifts";
import type { RecurrenceType, ShiftType } from "./types";
import { formatDateISO, parseISODate } from "./week";

export function getDatesForRecurrence(
  recurrence: RecurrenceType,
  startDate: string,
  endDate: string,
  weekday?: number | null
): string[] {
  const dates: string[] = [];
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  if (recurrence === "daily") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDateISO(new Date(d)));
    }
    return dates;
  }

  if (recurrence === "weekly" || recurrence === "biweekly") {
    const step = recurrence === "biweekly" ? 14 : 7;
    const targetDay = weekday ?? start.getDay();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === targetDay) {
        dates.push(formatDateISO(new Date(d)));
        d.setDate(d.getDate() + step - 1);
      }
    }
    return dates;
  }

  if (recurrence === "monthly") {
    const dayOfMonth = start.getDate();
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const candidate = new Date(d.getFullYear(), d.getMonth(), dayOfMonth);
      if (candidate >= start && candidate <= end) {
        dates.push(formatDateISO(candidate));
      }
    }
    return dates;
  }

  if (recurrence === "last_weekday") {
    const targetDay = weekday ?? 2;
    for (
      let month = new Date(start.getFullYear(), start.getMonth(), 1);
      month <= end;
      month.setMonth(month.getMonth() + 1)
    ) {
      const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      while (last.getDay() !== targetDay) {
        last.setDate(last.getDate() - 1);
      }
      if (last >= start && last <= end) {
        dates.push(formatDateISO(last));
      }
    }
    return dates;
  }

  return dates;
}

export function buildShiftRows(
  employeeId: string,
  shiftType: ShiftType,
  dates: string[]
) {
  const times = getShiftDbTimes(shiftType);
  return dates.map((date) => ({
    employee_id: employeeId,
    date,
    shift_type: shiftType,
    start_time: times.start_time,
    end_time: times.end_time,
  }));
}
