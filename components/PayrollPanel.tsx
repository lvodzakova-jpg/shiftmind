"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { formatMaxHours } from "@/lib/hours";
import { downloadPayrollExport } from "@/lib/payroll-integrations";
import { buildPayrollRows, payrollToCsv } from "@/lib/payroll";
import type {
  Employee,
  LeaveRequest,
  Shift,
  TimeLog,
} from "@/lib/types";
import { useMemo, useState } from "react";

interface PayrollPanelProps {
  staff: Employee[];
  shifts: Shift[];
  timeLogs: TimeLog[];
  leaveRequests: LeaveRequest[];
  mealAllowance: number;
  branchName?: string;
}

export function PayrollPanel({
  staff,
  shifts,
  timeLogs,
  leaveRequests,
  mealAllowance,
  branchName = "ShiftMind",
}: PayrollPanelProps) {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const rows = useMemo(
    () =>
      buildPayrollRows(
        staff,
        shifts,
        timeLogs,
        leaveRequests,
        mealAllowance,
        year,
        month
      ),
    [staff, shifts, timeLogs, leaveRequests, mealAllowance, year, month]
  );

  const totals = useMemo(
    () => ({
      scheduled: rows.reduce((s, r) => s + r.scheduledHours, 0),
      actual: rows.reduce((s, r) => s + r.actualHours, 0),
      overtime: rows.reduce((s, r) => s + r.overtimeHours, 0),
      cost: rows.reduce((s, r) => s + r.laborCost, 0),
    }),
    [rows]
  );

  function handleExport() {
    const csv = payrollToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-foreground">
          {t("payroll.month")}
          <input
            type="month"
            value={`${year}-${String(month).padStart(2, "0")}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              setYear(y);
              setMonth(m);
            }}
            className="ml-2 rounded-lg border border-default px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover"
        >
          {t("payroll.exportCsv")}
        </button>
      </div>

      <section className="mb-6 rounded-2xl border border-default bg-subtle p-6">
        <h2 className="mb-1 font-semibold">{t("payroll.integrationsTitle")}</h2>
        <p className="mb-4 text-sm text-muted">{t("payroll.integrationsDesc")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadPayrollExport("pohoda", rows, year, month, branchName)}
            className="rounded-lg border border-default bg-surface px-4 py-2 text-sm font-medium hover:bg-subtle"
          >
            {t("payroll.exportPohoda")}
          </button>
          <button
            type="button"
            onClick={() => downloadPayrollExport("sage", rows, year, month, branchName)}
            className="rounded-lg border border-default bg-surface px-4 py-2 text-sm font-medium hover:bg-subtle"
          >
            {t("payroll.exportSage")}
          </button>
          <button
            type="button"
            onClick={() => downloadPayrollExport("money_s3", rows, year, month, branchName)}
            className="rounded-lg border border-default bg-surface px-4 py-2 text-sm font-medium hover:bg-subtle"
          >
            {t("payroll.exportMoneyS3")}
          </button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-default bg-surface shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-default bg-subtle">
              <th className="px-4 py-3 text-left font-semibold">{t("payroll.employee")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("payroll.scheduled")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("payroll.actual")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("payroll.overtime")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("payroll.absences")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("payroll.meal")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("payroll.cost")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employeeId} className="border-b border-default">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-right">{formatMaxHours(row.scheduledHours)}</td>
                <td className="px-4 py-3 text-right">{formatMaxHours(row.actualHours)}</td>
                <td className="px-4 py-3 text-right">{formatMaxHours(row.overtimeHours)}</td>
                <td className="px-4 py-3 text-right">{row.absenceDays}</td>
                <td className="px-4 py-3 text-right">€{row.mealAllowance.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">€{row.laborCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-subtle font-semibold">
              <td className="px-4 py-3">{t("payroll.total")}</td>
              <td className="px-4 py-3 text-right">{formatMaxHours(totals.scheduled)}</td>
              <td className="px-4 py-3 text-right">{formatMaxHours(totals.actual)}</td>
              <td className="px-4 py-3 text-right">{formatMaxHours(totals.overtime)}</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">€{totals.cost.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
