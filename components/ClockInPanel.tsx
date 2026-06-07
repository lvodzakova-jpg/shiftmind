"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { ShiftBadge } from "@/components/ShiftBadge";
import { COLS, TABLES } from "@/lib/db";
import { getCurrentPosition, haversineDistanceM } from "@/lib/gps";
import { createBrowserClient } from "@/lib/supabase/client";
import type { BranchSettings } from "@/lib/types";
import {
  exceedsScheduledBy15Min,
  hoursBetweenTimestamps,
  hoursBetweenTimes,
} from "@/lib/time";
import type { Shift, Staff, TimeLog } from "@/lib/types";
import { formatDateISO } from "@/lib/week";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface ClockInPanelProps {
  staff: Staff[];
  todayShifts: Shift[];
  timeLogs: TimeLog[];
  branchSettings?: BranchSettings | null;
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale === "sk" ? "sk-SK" : locale === "es" ? "es-ES" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClockInPanel({
  staff,
  todayShifts: initialTodayShifts,
  timeLogs: initialTimeLogs,
  branchSettings,
}: ClockInPanelProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const today = formatDateISO(new Date());

  const [selectedId, setSelectedId] = useState(staff[0]?.id ?? "");
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [overtimeWarning, setOvertimeWarning] = useState<string | null>(null);
  const [gpsWarning, setGpsWarning] = useState<string | null>(null);

  const todayShift = useMemo(
    () => initialTodayShifts.find((s) => s.employee_id === selectedId),
    [initialTodayShifts, selectedId]
  );

  const activeLog = useMemo(
    () =>
      timeLogs.find(
        (log) => log.employee_id === selectedId && log.clock_out === null
      ),
    [timeLogs, selectedId]
  );

  const completedTodayLog = useMemo(
    () =>
      timeLogs.find(
        (log) =>
          log.employee_id === selectedId &&
          log.clock_out !== null &&
          log.clock_in.startsWith(today)
      ),
    [timeLogs, selectedId, today]
  );

  const scheduledHours = todayShift
    ? hoursBetweenTimes(todayShift.start_time, todayShift.end_time)
    : 0;

  async function handleClockIn() {
    if (!selectedId || activeLog) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    setOvertimeWarning(null);
    setGpsWarning(null);

    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await getCurrentPosition();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      if (
        branchSettings?.workplace_lat != null &&
        branchSettings?.workplace_lng != null
      ) {
        const dist = Math.round(
          haversineDistanceM(
            lat,
            lng,
            branchSettings.workplace_lat,
            branchSettings.workplace_lng
          )
        );
        if (dist > branchSettings.gps_radius_m) {
          setGpsWarning(
            t("clockin.gpsWarning", {
              distance: dist,
              radius: branchSettings.gps_radius_m,
            })
          );
        }
      }
    } catch {
      setGpsWarning(t("clockin.gpsError"));
    }

    const supabase = createBrowserClient();
    const { data, error: insertError } = await supabase
      .from(TABLES.timeLogs)
      .insert({
        [COLS.employeeId]: selectedId,
        [COLS.shiftId]: todayShift?.id ?? null,
        [COLS.clockIn]: new Date().toISOString(),
        [COLS.clockInLat]: lat,
        [COLS.clockInLng]: lng,
      })
      .select()
      .single();

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      setTimeLogs((prev) => [...prev, data as TimeLog]);
      setMessage(t("clockin.successIn"));
      router.refresh();
    }
  }

  async function handleClockOut() {
    if (!selectedId || !activeLog) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    setOvertimeWarning(null);
    setGpsWarning(null);

    let outLat: number | null = null;
    let outLng: number | null = null;
    try {
      const pos = await getCurrentPosition();
      outLat = pos.coords.latitude;
      outLng = pos.coords.longitude;
    } catch {
      /* optional on clock out */
    }

    const clockOut = new Date();
    const actualHours = hoursBetweenTimestamps(activeLog.clock_in, clockOut);
    const overtimeHours = Math.max(0, actualHours - scheduledHours);

    if (exceedsScheduledBy15Min(actualHours, scheduledHours)) {
      setOvertimeWarning(
        t("clockin.overtimeWarning", {
          actual: actualHours,
          scheduled: scheduledHours,
        })
      );
    }

    const supabase = createBrowserClient();
    const { data, error: updateError } = await supabase
      .from(TABLES.timeLogs)
      .update({
        [COLS.clockOut]: clockOut.toISOString(),
        [COLS.actualHours]: actualHours,
        [COLS.overtimeHours]: overtimeHours,
        [COLS.clockOutLat]: outLat,
        [COLS.clockOutLng]: outLng,
      })
      .eq("id", activeLog.id)
      .select()
      .single();

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (data) {
      setTimeLogs((prev) =>
        prev.map((log) => (log.id === activeLog.id ? (data as TimeLog) : log))
      );
      setMessage(t("clockin.successOut", { hours: actualHours }));
      router.refresh();
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <label
          htmlFor="clock-employee"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t("clockin.selectEmployee")}
        </label>
        <select
          id="clock-employee"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setMessage(null);
            setError(null);
            setOvertimeWarning(null);
          }}
          className="w-full rounded-lg border border-default px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("clockin.todayShift")}
        </h2>

        {todayShift ? (
          <div className="space-y-3">
            <ShiftBadge type={todayShift.shift_type} />
            <p className="text-sm text-muted">
              {todayShift.start_time.slice(0, 5)} –{" "}
              {todayShift.end_time.slice(0, 5)}
            </p>
            <p className="text-sm text-muted">
              {t("clockin.scheduledHours", { hours: scheduledHours })}
            </p>
          </div>
        ) : (
          <p className="text-muted">{t("clockin.noShiftToday")}</p>
        )}

        {activeLog && (
          <div className="mt-4 rounded-xl border border-accent/30 bg-subtle p-4">
            <p className="text-sm font-medium text-brand">
              {t("clockin.activeSession")}
            </p>
            <p className="mt-1 text-sm text-accent">
              {t("clockin.clockedInAt", {
                time: formatTime(activeLog.clock_in, locale),
              })}
            </p>
          </div>
        )}

        {completedTodayLog && !activeLog && (
          <div className="mt-4 rounded-xl border border-default bg-subtle p-4 text-sm text-muted">
            <p>
              {t("clockin.clockedOutAt", {
                time: formatTime(completedTodayLog.clock_out!, locale),
              })}
            </p>
            {completedTodayLog.actual_hours != null && (
              <p className="mt-1">
                {t("clockin.actualHours", {
                  hours: completedTodayLog.actual_hours,
                })}
              </p>
            )}
            {(completedTodayLog.overtime_hours ?? 0) > 0 && (
              <p className="mt-1 font-medium text-rose-700">
                {t("clockin.overtimeHours", {
                  hours: completedTodayLog.overtime_hours ?? 0,
                })}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClockIn}
            disabled={loading || !!activeLog || !!completedTodayLog}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {t("clockin.clockIn")}
          </button>
          <button
            type="button"
            onClick={handleClockOut}
            disabled={loading || !activeLog}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {t("clockin.clockOut")}
          </button>
        </div>

        {gpsWarning && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">
            {gpsWarning}
          </p>
        )}
        {overtimeWarning && (
          <p className="mt-4 rounded-xl border border-default bg-subtle p-3 text-sm text-brand" role="alert">
            {overtimeWarning}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 text-sm text-accent" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
