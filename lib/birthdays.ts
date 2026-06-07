import type { Staff } from "@/lib/types";

export interface BirthdayEntry {
  employee: Staff;
  /** Birthday in the current year (YYYY-MM-DD). */
  date: string;
  daysUntil: number;
}

function parseMonthDay(birthDate: string): { month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getUpcomingBirthdays(
  staff: Staff[],
  referenceDate: Date = new Date(),
  withinDays = 30
): BirthdayEntry[] {
  const today = startOfDay(referenceDate);
  const year = today.getFullYear();
  const entries: BirthdayEntry[] = [];

  for (const employee of staff) {
    if (!employee.birth_date) continue;
    const parts = parseMonthDay(employee.birth_date);
    if (!parts) continue;

    let birthday = startOfDay(new Date(year, parts.month - 1, parts.day));
    if (birthday < today) {
      birthday = startOfDay(new Date(year + 1, parts.month - 1, parts.day));
    }

    const daysUntil = Math.round(
      (birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil > withinDays) continue;

    entries.push({
      employee,
      date: toIsoDate(birthday.getFullYear(), parts.month, parts.day),
      daysUntil,
    });
  }

  return entries.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function formatBirthdayDate(
  isoDate: string,
  locale: string,
  includeYear = false
): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}
