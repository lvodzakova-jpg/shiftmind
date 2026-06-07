"use client";

import { useTranslation } from "@/components/LanguageProvider";
import {
  computeCostByRole,
  computeDailyLaborCosts,
  computeProjectedWeekCost,
  type DailyLaborCost,
} from "@/lib/kpi";
import type { Employee, Shift, TimeLog } from "@/lib/types";

interface LaborCostPanelProps {
  staff: Employee[];
  shifts: Shift[];
  timeLogs: TimeLog[];
  weekDates: string[];
  weeklyBudget: number;
}

export function LaborCostPanel({
  staff,
  shifts,
  timeLogs,
  weekDates,
  weeklyBudget,
}: LaborCostPanelProps) {
  const { t } = useTranslation();
  const daily = computeDailyLaborCosts(staff, shifts, timeLogs, weekDates);
  const byRole = computeCostByRole(staff, shifts);
  const { projected, onTrack } = computeProjectedWeekCost(daily, weeklyBudget);
  const maxCost = Math.max(...daily.map((d) => d.laborCost), 1);

  return (
    <section className="mb-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{t("kpi.dailyCosts")}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              onTrack ? "bg-subtle text-brand" : "bg-rose-100 text-rose-800"
            }`}
          >
            {t("kpi.projectedWeek")}: €{projected.toFixed(0)} ·{" "}
            {onTrack ? t("kpi.onTrack") : t("kpi.overBudget")}
          </span>
        </div>
        <div className="flex h-32 items-end gap-2">
          {daily.map((d) => (
            <DailyBar key={d.date} day={d} max={maxCost} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted">
          {daily.map((d) => (
            <span key={d.date}>{d.date.slice(8)}.</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-foreground">{t("kpi.costByRole")}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default text-left text-muted">
              <th className="pb-2 font-medium">{t("staff.roleLabel")}</th>
              <th className="pb-2 text-right font-medium">{t("kpi.headcount")}</th>
              <th className="pb-2 text-right font-medium">{t("kpi.scheduled")}</th>
              <th className="pb-2 text-right font-medium">{t("payroll.cost")}</th>
            </tr>
          </thead>
          <tbody>
            {byRole.map((row) => (
              <tr key={row.role} className="border-b border-default last:border-0">
                <td className="py-2 capitalize">{row.role.replace(/_/g, " ")}</td>
                <td className="py-2 text-right">{row.headcount}</td>
                <td className="py-2 text-right">{row.scheduledHours}h</td>
                <td className="py-2 text-right font-medium">€{row.laborCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DailyBar({ day, max }: { day: DailyLaborCost; max: number }) {
  const height = Math.max(4, (day.laborCost / max) * 100);
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-1">
      <span className="text-[10px] font-medium text-foreground">
        €{day.laborCost.toFixed(0)}
      </span>
      <div
        className="w-full rounded-t-md bg-brand transition-all"
        style={{ height: `${height}%` }}
        title={`${day.date}: €${day.laborCost}`}
      />
    </div>
  );
}
