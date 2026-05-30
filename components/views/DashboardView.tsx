"use client";

import { GenerateScheduleButton } from "@/components/GenerateScheduleButton";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { ShiftBadge } from "@/components/ShiftBadge";
import { buildAlerts } from "@/lib/alerts";
import { formatMaxHours } from "@/lib/hours";
import { getDayNamesShort } from "@/lib/i18n";
import {
  getTotalLoggedOvertime,
  getWeeklyHoursSummaries,
} from "@/lib/overtime";
import { isWorkingShift } from "@/lib/shifts";
import type { Preference, Shift, ShiftType, Staff, TimeLog } from "@/lib/types";
import { addWeeks, formatWeekRange, getWeekDates } from "@/lib/week";
import { useMemo } from "react";
import Link from "next/link";

interface DashboardViewProps {
  weekStart: string;
  staff: Staff[];
  shifts: Shift[];
  preferences: Preference[];
  timeLogs: TimeLog[];
}

export function DashboardView({
  weekStart,
  staff,
  shifts,
  preferences,
  timeLogs,
}: DashboardViewProps) {
  const { locale, t } = useTranslation();

  const alerts = useMemo(
    () => buildAlerts(locale, staff, shifts, preferences, weekStart),
    [locale, staff, shifts, preferences, weekStart]
  );
  const weekDates = getWeekDates(weekStart);
  const dayNamesShort = getDayNamesShort(locale);

  const stats: Record<ShiftType, number> = {
    morning: 0,
    evening: 0,
    full: 0,
    off: 0,
    sick: 0,
  };
  for (const s of shifts) {
    stats[s.shift_type as ShiftType]++;
  }

  const workingDays = weekDates.map((date) => ({
    date,
    count: shifts.filter(
      (s) => s.date === date && isWorkingShift(s.shift_type as ShiftType)
    ).length,
  }));

  const shiftLegend = (["morning", "evening", "full", "off", "sick"] as ShiftType[])
    .map((type) => `${t(`shifts.${type}`)} (${type})`)
    .join(" · ");

  const overtimeSummaries = useMemo(
    () => getWeeklyHoursSummaries(staff, shifts),
    [staff, shifts]
  );
  const totalLoggedOvertime = useMemo(
    () => getTotalLoggedOvertime(timeLogs),
    [timeLogs]
  );

  const prev = addWeeks(weekStart, -1);
  const next = addWeeks(weekStart, 1);

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.weekLabel", {
          range: formatWeekRange(weekStart, locale),
        })}
      />

      <div className="mb-6 flex justify-center gap-2 text-sm">
        <Link
          href={`/?week=${prev}`}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 hover:bg-stone-50"
        >
          ← {t("common.previous")}
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 hover:bg-stone-50"
        >
          {t("common.currentWeek")}
        </Link>
        <Link
          href={`/?week=${next}`}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 hover:bg-stone-50"
        >
          {t("common.next")} →
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              {t("dashboard.aiTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-stone-600">{t("dashboard.aiDesc")}</p>
          </div>
          <GenerateScheduleButton weekStart={weekStart} />
        </div>
      </div>

      {alerts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            {t("dashboard.alerts")}
          </h2>
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  alert.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : alert.type === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-sky-200 bg-sky-50 text-sky-900"
                }`}
              >
                {alert.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="mb-4 font-semibold text-stone-900">
            {t("dashboard.summary")}
          </h2>
          <dl className="space-y-3">
            {(Object.keys(stats) as ShiftType[]).map((type) => (
              <div key={type} className="flex items-center justify-between gap-2">
                <ShiftBadge type={type} compact />
                <dd className="text-lg font-bold text-stone-800">{stats[type]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-stone-500">
            {t("dashboard.totalAssignments", {
              shifts: shifts.length,
              staff: staff.length,
            })}
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold text-stone-900">
            {t("dashboard.coverage")}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {workingDays.map((day, i) => (
              <div
                key={day.date}
                className={`rounded-xl border p-3 text-center ${
                  day.count >= 2
                    ? "border-emerald-200 bg-emerald-50"
                    : day.count === 1
                      ? "border-amber-200 bg-amber-50"
                      : "border-stone-200 bg-stone-50"
                }`}
              >
                <div className="text-xs font-medium text-stone-500">
                  {dayNamesShort[i]}
                </div>
                <div className="mt-1 text-2xl font-bold text-stone-900">
                  {day.count}
                </div>
                <div className="text-[10px] text-stone-500">
                  {t("dashboard.workers")}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h2 className="mb-3 font-semibold text-stone-900">
          {t("dashboard.overtimeTitle")}
        </h2>
        {overtimeSummaries.length === 0 ? (
          <p className="text-sm text-stone-600">{t("dashboard.overtimeEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {overtimeSummaries.map((item) => (
              <li
                key={item.employeeId}
                className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm text-rose-900"
              >
                {t("dashboard.overtimeRow", {
                  name: item.name,
                  scheduled: formatMaxHours(item.scheduledHours),
                  max: formatMaxHours(item.maxHours),
                  excess: formatMaxHours(item.excess),
                })}
              </li>
            ))}
          </ul>
        )}
        {totalLoggedOvertime > 0 && (
          <p className="mt-3 text-sm font-medium text-rose-800">
            {t("dashboard.loggedOvertime", {
              hours: formatMaxHours(totalLoggedOvertime),
            })}
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">{t("dashboard.quickLinks")}</h2>
          <Link
            href={`/schedule?week=${weekStart}`}
            className="text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            {t("common.openFullSchedule")}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickLink
            href="/schedule"
            title={t("dashboard.quickScheduleTitle")}
            desc={t("dashboard.quickScheduleDesc")}
          />
          <QuickLink
            href="/staff"
            title={t("dashboard.quickStaffTitle")}
            desc={t("dashboard.quickStaffDesc")}
          />
          <QuickLink
            href="/preferences"
            title={t("dashboard.quickPrefsTitle")}
            desc={t("dashboard.quickPrefsDesc")}
          />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-stone-400">
        {t("dashboard.shiftTypesLegend", { legend: shiftLegend })}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-500">{desc}</p>
    </Link>
  );
}
