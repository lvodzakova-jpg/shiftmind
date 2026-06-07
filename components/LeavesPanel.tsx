"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { COLS, TABLES } from "@/lib/db";
import {
  LEAVE_TYPES,
  countLeaveDays,
  getDateRange,
  leaveTypeToShiftType,
} from "@/lib/leaves";
import { getShiftDbTimes } from "@/lib/shifts";
import { showLocalNotification } from "@/lib/push-client";
import { createBrowserClient } from "@/lib/supabase/client";
import type { LeaveBalance, LeaveRequest, LeaveType, Staff } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LeavesPanelProps {
  staff: Staff[];
  requests: LeaveRequest[];
  balances: LeaveBalance[];
}

export function LeavesPanel({
  staff,
  requests: initialRequests,
  balances,
}: LeavesPanelProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [employeeId, setEmployeeId] = useState(staff[0]?.id ?? "");
  const [type, setType] = useState<LeaveType>("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getBalance(empId: string, leaveType: LeaveType) {
    const bal = balances.find(
      (b) => b.employee_id === empId && b.leave_type === leaveType
    );
    if (!bal) return null;
    return { total: bal.total_days, remaining: bal.total_days - bal.used_days };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate) return;
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    const { data, error: insertError } = await supabase
      .from(TABLES.leaveRequests)
      .insert({
        employee_id: employeeId,
        type,
        start_date: startDate,
        end_date: endDate,
        note: note.trim() || null,
        status: "pending",
      })
      .select()
      .single();
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setRequests((prev) => [data as LeaveRequest, ...prev]);
      setNote("");
      router.refresh();
    }
  }

  async function handleStatus(id: string, status: "approved" | "rejected") {
    const supabase = createBrowserClient();
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    const { error: updateError } = await supabase
      .from(TABLES.leaveRequests)
      .update({ status })
      .eq("id", id);

    if (updateError) return;

    if (status === "approved") {
      const dates = getDateRange(req.start_date, req.end_date);
      const shiftType = leaveTypeToShiftType(req.type);
      const times = getShiftDbTimes(shiftType);
      const rows = dates.map((date) => ({
        employee_id: req.employee_id,
        date,
        shift_type: shiftType,
        start_time: times.start_time,
        end_time: times.end_time,
      }));
      await supabase.from(TABLES.shifts).upsert(rows, {
        onConflict: "employee_id,date",
      });

      const days = countLeaveDays(req.start_date, req.end_date);
      const year = new Date(req.start_date).getFullYear();
      const { data: existing } = await supabase
        .from(TABLES.leaveBalances)
        .select("*")
        .eq(COLS.employeeId, req.employee_id)
        .eq("leave_type", req.type)
        .eq("year", year)
        .maybeSingle();

      if (existing) {
        await supabase
          .from(TABLES.leaveBalances)
          .update({ used_days: existing.used_days + days })
          .eq("id", existing.id);
      }

      showLocalNotification(
        t("leaves.title"),
        t(`leaves.${status}`)
      );
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    router.refresh();
  }

  const empName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">{t("leaves.newRequest")}</h2>
        <div className="space-y-3">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeaveType)}
            className="w-full rounded-lg border border-default px-3 py-2"
          >
            {LEAVE_TYPES.map((lt) => (
              <option key={lt} value={lt}>
                {t(`leaves.types.${lt}`)}
              </option>
            ))}
          </select>
          {employeeId && getBalance(employeeId, type) && (
            <p className="text-sm text-muted">
              {t("leaves.balance", {
                remaining: getBalance(employeeId, type)!.remaining,
                total: getBalance(employeeId, type)!.total,
              })}
            </p>
          )}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-default px-3 py-2"
            required
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-default px-3 py-2"
            required
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("leaves.note")}
            className="w-full rounded-lg border border-default px-3 py-2"
            rows={2}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {t("leaves.submit")}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </form>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-muted">{t("leaves.empty")}</p>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-default bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{empName(req.employee_id)}</p>
                  <p className="text-sm text-muted">
                    {t(`leaves.types.${req.type}`)} · {req.start_date} – {req.end_date}
                  </p>
                  {req.note && (
                    <p className="mt-1 text-sm text-muted">{req.note}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    req.status === "approved"
                      ? "bg-subtle text-brand"
                      : req.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-subtle text-brand"
                  }`}
                >
                  {t(`leaves.${req.status}`)}
                </span>
              </div>
              {req.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatus(req.id, "approved")}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-on-brand hover:bg-brand-hover"
                  >
                    {t("leaves.approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(req.id, "rejected")}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    {t("leaves.reject")}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
