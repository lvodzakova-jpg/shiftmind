import {
  DEFAULT_LOCALE,
  LOCALE_DATE_FORMAT,
  type Locale,
} from "./i18n";

/** Monday of the week containing `date` (local time). */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekDates(weekStartISO: string): string[] {
  const start = parseISODate(weekStartISO);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return formatDateISO(d);
  });
}

export function formatWeekRange(
  weekStartISO: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const dates = getWeekDates(weekStartISO);
  const start = parseISODate(dates[0]);
  const end = parseISODate(dates[6]);
  const fmt = (d: Date) =>
    d.toLocaleDateString(LOCALE_DATE_FORMAT[locale], {
      day: "numeric",
      month: "short",
    });
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

export function getWeekEnd(weekStartISO: string): string {
  const dates = getWeekDates(weekStartISO);
  return dates[6];
}

export function addWeeks(weekStartISO: string, weeks: number): string {
  const d = parseISODate(weekStartISO);
  d.setDate(d.getDate() + weeks * 7);
  return formatDateISO(getWeekStart(d));
}
