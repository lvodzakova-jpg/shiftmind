"use client";

import { DuplicateWeekButton } from "@/components/DuplicateWeekButton";
import { GenerateScheduleButton } from "@/components/GenerateScheduleButton";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { ShiftEditCell } from "@/components/ShiftEditCell";
import { ShiftBadge } from "@/components/ShiftBadge";
import {
  checkLegalCompliance,
  formatLegalViolation,
} from "@/lib/legal-compliance";
import {
  getScheduledWeeklyHours,
  isOverWeeklyLimit,
} from "@/lib/overtime";
import { getDayNamesShort } from "@/lib/i18n";
import { formatMaxHours } from "@/lib/hours";
import type { BranchSettings, Shift, ShiftType, Staff } from "@/lib/types";
import { addWeeks, formatWeekRange, getWeekDates } from "@/lib/week";
import Link from "next/link";
import { useMemo } from "react";

interface ScheduleViewProps {
  weekStart: string;
  staff: Staff[];
  shifts: Shift[];
  branchSettings?: BranchSettings | null;
}

export function ScheduleView({
  weekStart,
  staff,
  shifts,
  branchSettings,
}: ScheduleViewProps) {
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

  const legalViolations = useMemo(
    () =>
      checkLegalCompliance(
        staff,
        shifts,
        weekStart,
        branchSettings?.legal_country ?? "sk"
      ),
    [staff, shifts, weekStart, branchSettings?.legal_country]
  );

  const violationDates = useMemo(() => {
    const set = new Set<string>();
    for (const v of legalViolations) {
      if (v.date) set.add(`${v.employeeId}:${v.date}`);
    }
    return set;
  }, [legalViolations]);

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
              className="rounded-lg border border-default bg-surface px-3 py-2 text-sm hover:bg-subtle"
              aria-label={t("aria.prevWeek")}
            >
              ←
            </Link>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {formatWeekRange(weekStart, locale)}
            </span>
            <Link
              href={`/schedule?week=${addWeeks(weekStart, 1)}`}
              className="rounded-lg border border-default bg-surface px-3 py-2 text-sm hover:bg-subtle"
              aria-label={t("aria.nextWeek")}
            >
              →
            </Link>
          </div>
          <DuplicateWeekButton weekStart={weekStart} />
          <GenerateScheduleButton weekStart={weekStart} variant="secondary" />
        </div>
      </PageHeader>

      {legalViolations.length > 0 && (
        <section className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-rose-800">
            {t("schedule.legalWarnings")}
          </h2>
          <ul className="space-y-1">
            {legalViolations.map((v) => (
              <li key={v.id} className="text-sm text-rose-900">
                {formatLegalViolation(t, v)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default bg-surface p-12 text-center">
          <p className="text-muted">{t("schedule.noStaff")}</p>
          <Link
            href="/staff"
            className="mt-4 inline-block font-medium text-brand hover:underline"
          >
            {t("schedule.addStaff")}
          </Link>
        </div>
      ) : (
        <>
        <p className="mb-3 text-sm text-muted">{t("schedule.manualEditHint")}</p>
        <div className="overflow-x-auto rounded-2xl border border-default bg-surface shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-default bg-subtle">
                <th className="sticky left-0 z-10 bg-subtle px-4 py-3 text-left font-semibold text-foreground">
                  {t("schedule.employee")}
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={date}
                    className="px-2 py-3 text-center font-semibold text-foreground"
                  >
                    <div>{dayNamesShort[i]}</div>
                    <div className="text-xs font-normal text-muted">
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
                    className={`border-b border-default last:border-0 hover:bg-subtle/50 ${
                      overLimit ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 border-r border-default bg-surface px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div>
                          <div className="font-medium text-foreground">
                            {person.name}
                          </div>
                          <div className="text-xs text-muted">
                            {person.role}
                          </div>
                          <div className="text-xs text-muted">
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
                      const hasViolation = violationDates.has(
                        `${person.id}:${date}`
                      );
                      return (
                        <ShiftEditCell
                          key={date}
                          employeeId={person.id}
                          date={date}
                          shiftType={type}
                          hasViolation={hasViolation}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium uppercase text-muted">
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
        <p className="mt-6 text-center text-muted">
          {t("schedule.empty")}{" "}
          <Link href="/dashboard" className="font-medium text-brand hover:underline">
            {t("schedule.goOverview")}
          </Link>
        </p>
      )}
    </div>
  );
}
