"use client";

import { GenerateScheduleButton } from "@/components/GenerateScheduleButton";
import { LaborCostPanel } from "@/components/LaborCostPanel";
import { WeekComparisonChart } from "@/components/WeekComparisonChart";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { ShiftBadge } from "@/components/ShiftBadge";
import { computeKpis, computeWeekComparison } from "@/lib/kpi";
import { buildAlerts } from "@/lib/alerts";
import {
  formatBirthdayDate,
  getUpcomingBirthdays,
} from "@/lib/birthdays";
import { formatMaxHours } from "@/lib/hours";
import { getDayNamesShort, LOCALE_DATE_FORMAT } from "@/lib/i18n";
import {
  getTotalLoggedOvertime,
  getWeeklyHoursSummaries,
} from "@/lib/overtime";
import { isWorkingShift } from "@/lib/shifts";
import type {
  BranchSettings,
  Preference,
  Shift,
  ShiftType,
  Staff,
  TimeLog,
} from "@/lib/types";
import { addWeeks, formatWeekRange, getWeekDates } from "@/lib/week";
import { useMemo } from "react";
import Link from "next/link";

interface DashboardViewProps {
  weekStart: string;
  staff: Staff[];
  shifts: Shift[];
  preferences: Preference[];
  timeLogs: TimeLog[];
  prevShifts: Shift[];
  prevTimeLogs: TimeLog[];
  branchSettings: BranchSettings | null;
}

export function DashboardView({
  weekStart,
  staff,
  shifts,
  preferences,
  timeLogs,
  prevShifts,
  prevTimeLogs,
  branchSettings,
}: DashboardViewProps) {
  const { locale, t } = useTranslation();

  const alerts = useMemo(
    () =>
      buildAlerts(
        locale,
        staff,
        shifts,
        preferences,
        weekStart,
        branchSettings?.min_staff_per_shift ?? 2
      ),
    [locale, staff, shifts, preferences, weekStart, branchSettings?.min_staff_per_shift]
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

  const kpis = useMemo(
    () =>
      computeKpis(
        staff,
        shifts,
        timeLogs,
        branchSettings?.weekly_budget ?? 0
      ),
    [staff, shifts, timeLogs, branchSettings?.weekly_budget]
  );

  const weekComparison = useMemo(
    () =>
      computeWeekComparison(
        staff,
        shifts,
        timeLogs,
        prevShifts,
        prevTimeLogs
      ),
    [staff, shifts, timeLogs, prevShifts, prevTimeLogs]
  );

  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(staff), [staff]);
  const todayBirthdays = upcomingBirthdays.filter((b) => b.daysUntil === 0);
  const laterBirthdays = upcomingBirthdays.filter((b) => b.daysUntil > 0);
  const dateLocale = LOCALE_DATE_FORMAT[locale];

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
          href={`/dashboard?week=${prev}`}
          className="rounded-lg border border-default bg-surface px-3 py-2 hover:bg-subtle"
        >
          ← {t("common.previous")}
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-default bg-surface px-3 py-2 hover:bg-subtle"
        >
          {t("common.currentWeek")}
        </Link>
        <Link
          href={`/dashboard?week=${next}`}
          className="rounded-lg border border-default bg-surface px-3 py-2 hover:bg-subtle"
        >
          {t("common.next")} →
        </Link>
      </div>

      <div className="mb-8 rounded-xl border border-default bg-subtle p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t("dashboard.aiTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-muted">{t("dashboard.aiDesc")}</p>
          </div>
          <GenerateScheduleButton weekStart={weekStart} />
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
        <h2 className="mb-4 font-semibold text-foreground">
          {t("dashboard.birthdaysTitle")}
        </h2>
        {upcomingBirthdays.length === 0 ? (
          <p className="text-sm text-muted">{t("dashboard.birthdaysEmpty")}</p>
        ) : (
          <div className="space-y-4">
            {todayBirthdays.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  {t("dashboard.birthdaysToday")}
                </h3>
                <ul className="space-y-2">
                  {todayBirthdays.map((entry) => (
                    <li
                      key={entry.employee.id}
                      className="rounded-lg border border-amber-300 bg-surface px-4 py-2 text-sm font-medium text-amber-950"
                    >
                      🎂 {t("dashboard.birthdayToday", { name: entry.employee.name })}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {laterBirthdays.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.birthdaysUpcoming")}
                </h3>
                <ul className="space-y-2">
                  {laterBirthdays.map((entry) => (
                    <li
                      key={entry.employee.id}
                      className="rounded-lg border border-default bg-surface px-4 py-2 text-sm text-foreground"
                    >
                      {entry.daysUntil === 1
                        ? t("dashboard.birthdayTomorrow", {
                            name: entry.employee.name,
                            date: formatBirthdayDate(entry.date, dateLocale),
                          })
                        : t("dashboard.birthdayInDays", {
                            name: entry.employee.name,
                            date: formatBirthdayDate(entry.date, dateLocale),
                            days: entry.daysUntil,
                          })}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {alerts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
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
                      ? "border-default bg-subtle text-brand"
                      : "border-sky-200 bg-sky-50 text-sky-900"
                }`}
              >
                {alert.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <LaborCostPanel
        staff={staff}
        shifts={shifts}
        timeLogs={timeLogs}
        weekDates={weekDates}
        weeklyBudget={branchSettings?.weekly_budget ?? 0}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("dashboard.laborCost")}
          value={`€${kpis.totalLaborCost.toFixed(2)}`}
        />
        <KpiCard
          label={t("dashboard.budgetGauge")}
          value={`${kpis.budgetUsedPercent}%`}
          highlight={
            kpis.budgetUsedPercent > 100
              ? "rose"
              : kpis.budgetUsedPercent > 80
                ? "amber"
                : "emerald"
          }
        />
        <KpiCard
          label={t("dashboard.attendanceRate")}
          value={`${kpis.attendanceRate}%`}
        />
        <KpiCard
          label={t("dashboard.overtimePercent")}
          value={`${kpis.overtimePercent}%`}
        />
      </div>

      <section className="mb-8 rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-foreground">
          {t("dashboard.weekComparison")}
        </h2>
        <WeekComparisonChart data={weekComparison} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-default bg-surface p-6 shadow-sm lg:col-span-1">
          <h2 className="mb-4 font-semibold text-foreground">
            {t("dashboard.summary")}
          </h2>
          <dl className="space-y-3">
            {(Object.keys(stats) as ShiftType[]).map((type) => (
              <div key={type} className="flex items-center justify-between gap-2">
                <ShiftBadge type={type} compact />
                <dd className="text-lg font-bold text-foreground">{stats[type]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">
            {t("dashboard.totalAssignments", {
              shifts: shifts.length,
              staff: staff.length,
            })}
          </p>
        </section>

        <section className="rounded-2xl border border-default bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold text-foreground">
            {t("dashboard.coverage")}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {workingDays.map((day, i) => (
              <div
                key={day.date}
                className={`rounded-xl border p-3 text-center ${
                  day.count >= 2
                    ? "border-accent/30 bg-subtle"
                    : day.count === 1
                      ? "border-default bg-subtle"
                      : "border-default bg-subtle"
                }`}
              >
                <div className="text-xs font-medium text-muted">
                  {dayNamesShort[i]}
                </div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  {day.count}
                </div>
                <div className="text-[10px] text-muted">
                  {t("dashboard.workers")}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h2 className="mb-3 font-semibold text-foreground">
          {t("dashboard.overtimeTitle")}
        </h2>
        {overtimeSummaries.length === 0 ? (
          <p className="text-sm text-muted">{t("dashboard.overtimeEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {overtimeSummaries.map((item) => (
              <li
                key={item.employeeId}
                className="rounded-lg border border-rose-200 bg-surface px-4 py-2 text-sm text-rose-900"
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
          <h2 className="font-semibold text-foreground">{t("dashboard.quickLinks")}</h2>
          <Link
            href={`/schedule?week=${weekStart}`}
            className="text-sm font-medium text-brand hover:text-brand"
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

      <p className="mt-8 text-center text-xs text-muted">
        {t("dashboard.shiftTypesLegend", { legend: shiftLegend })}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "rose" | "amber" | "emerald";
}) {
  const border =
    highlight === "rose"
      ? "border-rose-200 bg-rose-50"
      : highlight === "amber"
        ? "border-default bg-subtle"
        : highlight === "emerald"
          ? "border-accent/30 bg-subtle"
          : "border-default bg-surface";
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
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
      className="rounded-xl border border-default bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </Link>
  );
}
