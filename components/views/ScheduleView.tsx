"use client";

import { GenerateScheduleButton } from "@/components/GenerateScheduleButton";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { ShiftBadge } from "@/components/ShiftBadge";
import {
  getScheduledWeeklyHours,
  isOverWeeklyLimit,
} from "@/lib/overtime";
import { getDayNamesShort } from "@/lib/i18n";
import { formatMaxHours } from "@/lib/hours";
import type { Shift, ShiftType, Staff } from "@/lib/types";
import { addWeeks, formatWeekRange, getWeekDates } from "@/lib/week";
import Link from "next/link";
import { useMemo } from "react";

interface ScheduleViewProps {
  weekStart: string;
  staff: Staff[];
  shifts: Shift[];
}

export function ScheduleView({ weekStart, staff, shifts }: ScheduleViewProps) {
  const { locale, t } = useTranslation();
  const weekDates = getWeekDates(weekStart);
  const dayNamesShort = getDayNamesShort(locale);

  const shiftMap = new Map<string, ShiftType>();
  for (const s of shifts) {
    shiftMap.set(`${s.employee_id}:${s.date}`, s.shift_type);
  }

  const weeklyHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of staff) {
      map.set(person.id, getScheduledWeeklyHours(person.id, shifts));
    }
    return map;
  }, [staff, shifts]);

  return (
    <div>
      <PageHeader
        title={t("schedule.title")}
        description={formatWeekRange(weekStart, locale)}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/schedule?week=${addWeeks(weekStart, -1)}`}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm hover:bg-stone-50"
              aria-label={t("aria.prevWeek")}
            >
              ←
            </Link>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {formatWeekRange(weekStart, locale)}
            </span>
            <Link
              href={`/schedule?week=${addWeeks(weekStart, 1)}`}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm hover:bg-stone-50"
              aria-label={t("aria.nextWeek")}
            >
              →
            </Link>
          </div>
          <GenerateScheduleButton weekStart={weekStart} variant="secondary" />
        </div>
      </PageHeader>

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-600">{t("schedule.noStaff")}</p>
          <Link
            href="/staff"
            className="mt-4 inline-block font-medium text-amber-700 hover:underline"
          >
            {t("schedule.addStaff")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="sticky left-0 z-10 bg-stone-50 px-4 py-3 text-left font-semibold text-stone-700">
                  {t("schedule.employee")}
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={date}
                    className="px-2 py-3 text-center font-semibold text-stone-700"
                  >
                    <div>{dayNamesShort[i]}</div>
                    <div className="text-xs font-normal text-stone-500">
                      {date.slice(8)}.{date.slice(5, 7)}.
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => {
                const weeklyHours = weeklyHoursMap.get(person.id) ?? 0;
                const overLimit = isOverWeeklyLimit(person, weeklyHours);
                return (
                  <tr
                    key={person.id}
                    className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/50 ${
                      overLimit ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 border-r border-stone-100 bg-white px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div>
                          <div className="font-medium text-stone-900">
                            {person.name}
                          </div>
                          <div className="text-xs text-stone-500">
                            {person.role}
                          </div>
                          <div className="text-xs text-stone-400">
                            {t("schedule.weeklyHours", {
                              scheduled: formatMaxHours(weeklyHours),
                              max: formatMaxHours(person.max_hours_per_week),
                            })}
                          </div>
                        </div>
                        {overLimit && (
                          <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-800">
                            {t("schedule.overtimeBadge")}
                          </span>
                        )}
                      </div>
                    </td>
                    {weekDates.map((date) => {
                      const type =
                        shiftMap.get(`${person.id}:${date}`) ?? "off";
                      return (
                        <td key={date} className="px-2 py-2 text-center">
                          <ShiftBadge type={type} compact />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase text-stone-500">
          {t("schedule.legend")}
        </span>
        {(["morning", "evening", "full", "off", "sick"] as ShiftType[]).map(
          (shiftType) => (
            <ShiftBadge key={shiftType} type={shiftType} compact />
          )
        )}
        <span className="text-xs text-rose-600">
          · {t("schedule.overtimeBadge")} = {t("overtime.overLimit")}
        </span>
      </div>

      {shifts.length === 0 && staff.length > 0 && (
        <p className="mt-6 text-center text-stone-500">
          {t("schedule.empty")}{" "}
          <Link href="/" className="font-medium text-amber-700 hover:underline">
            {t("schedule.goOverview")}
          </Link>
        </p>
      )}
    </div>
  );
}
