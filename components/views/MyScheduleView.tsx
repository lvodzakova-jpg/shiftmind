"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { ShiftBadge } from "@/components/ShiftBadge";
import { getCurrentEmployeeId, setCurrentEmployeeId } from "@/lib/current-user";
import { getDayNamesShort } from "@/lib/i18n";
import type { Shift, Staff } from "@/lib/types";
import { formatWeekRange, getWeekDates } from "@/lib/week";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface MyScheduleViewProps {
  weekStart: string;
  staff: Staff[];
  shifts: Shift[];
  notPublished?: boolean;
}

export function MyScheduleView({
  weekStart,
  staff,
  shifts,
  notPublished = false,
}: MyScheduleViewProps) {
  const { locale, t } = useTranslation();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const weekDates = getWeekDates(weekStart);
  const dayNames = getDayNamesShort(locale);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const id = getCurrentEmployeeId() ?? staff[0]?.id ?? null;
    if (id) {
      setEmployeeId(id);
      if (!getCurrentEmployeeId()) setCurrentEmployeeId(id);
    }
  }, [staff]);

  const myShifts = useMemo(
    () =>
      shifts.filter(
        (s) => s.employee_id === employeeId && weekDates.includes(s.date)
      ),
    [shifts, employeeId, weekDates]
  );

  const todayShift = myShifts.find((s) => s.date === today);

  return (
    <div className="mx-auto max-w-lg pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("nav.mySchedule")}</h1>
        <p className="text-sm text-muted">{formatWeekRange(weekStart, locale)}</p>
      </div>

      <p className="mb-6 rounded-xl border border-dashed border-default bg-subtle px-4 py-3 text-sm text-muted">
        {t("mobile.installHint")}
      </p>

      {notPublished && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("publish.notPublishedYet")}
        </p>
      )}

      {staff.length > 1 && (
        <select
          value={employeeId ?? ""}
          onChange={(e) => {
            setCurrentEmployeeId(e.target.value);
            setEmployeeId(e.target.value);
          }}
          className="mb-6 w-full rounded-xl border border-default px-4 py-3"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <section className="mb-6 rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("mobile.todayShift")}
        </h2>
        {todayShift && todayShift.shift_type !== "off" ? (
          <div className="flex items-center justify-between">
            <div>
              <ShiftBadge type={todayShift.shift_type} />
              <p className="mt-2 text-lg font-bold">
                {todayShift.start_time.slice(0, 5)} – {todayShift.end_time.slice(0, 5)}
              </p>
            </div>
            <Link
              href="/clockin"
              className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand hover:bg-brand-hover"
            >
              {t("mobile.clockInCta")}
            </Link>
          </div>
        ) : (
          <p className="text-muted">{t("mobile.noShiftToday")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-default bg-surface p-4 shadow-sm">
        <h2 className="mb-4 px-2 font-semibold">{t("mobile.myWeek")}</h2>
        <ul className="space-y-2">
          {weekDates.map((date, i) => {
            const shift = myShifts.find((s) => s.date === date);
            const type = shift?.shift_type ?? "off";
            return (
              <li
                key={date}
                className={`flex items-center justify-between rounded-xl px-3 py-3 ${
                  date === today ? "bg-subtle ring-1 ring-brand" : "bg-subtle/50"
                }`}
              >
                <div>
                  <span className="text-sm font-medium">{dayNames[i]}</span>
                  <span className="ml-2 text-xs text-muted">{date.slice(8)}.{date.slice(5, 7)}.</span>
                </div>
                <div className="flex items-center gap-2">
                  {shift && type !== "off" && (
                    <span className="text-xs text-muted">
                      {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
                    </span>
                  )}
                  <ShiftBadge type={type} compact />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
