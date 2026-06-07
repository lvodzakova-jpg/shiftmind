"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { haversineDistanceM } from "@/lib/gps";
import type { BranchSettings, Staff, TimeLog } from "@/lib/types";

interface AttendanceReportProps {
  staff: Staff[];
  timeLogs: TimeLog[];
  branchSettings: BranchSettings | null;
}

export function AttendanceReport({
  staff,
  timeLogs,
  branchSettings,
}: AttendanceReportProps) {
  const { t, locale } = useTranslation();

  const empName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(
      locale === "sk" ? "sk-SK" : locale === "es" ? "es-ES" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );
  }

  function getDistanceWarning(log: TimeLog): string | null {
    if (
      !branchSettings?.workplace_lat ||
      !branchSettings?.workplace_lng ||
      log.clock_in_lat == null ||
      log.clock_in_lng == null
    ) {
      return null;
    }
    const dist = Math.round(
      haversineDistanceM(
        log.clock_in_lat,
        log.clock_in_lng,
        branchSettings.workplace_lat,
        branchSettings.workplace_lng
      )
    );
    if (dist > branchSettings.gps_radius_m) {
      return t("attendance.farWarning", { distance: dist });
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {timeLogs.length === 0 ? (
        <p className="text-muted">{t("attendance.noGps")}</p>
      ) : (
        timeLogs.map((log) => {
          const warning = getDistanceWarning(log);
          const mapUrl =
            log.clock_in_lat != null && log.clock_in_lng != null
              ? `https://www.openstreetmap.org/?mlat=${log.clock_in_lat}&mlon=${log.clock_in_lng}#map=17/${log.clock_in_lat}/${log.clock_in_lng}`
              : null;
          return (
            <div
              key={log.id}
              className={`rounded-xl border bg-surface p-4 shadow-sm ${
                warning ? "border-rose-200" : "border-default"
              }`}
            >
              <p className="font-medium text-foreground">{empName(log.employee_id)}</p>
              <div className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
                <p>
                  {t("attendance.clockIn")}: {formatTime(log.clock_in)}
                  {log.clock_in_lat != null && (
                    <span className="ml-1 text-xs text-muted">
                      ({log.clock_in_lat.toFixed(5)}, {log.clock_in_lng?.toFixed(5)})
                    </span>
                  )}
                </p>
                {log.clock_out && (
                  <p>
                    {t("attendance.clockOut")}: {formatTime(log.clock_out)}
                  </p>
                )}
              </div>
              {warning && (
                <p className="mt-2 text-sm font-medium text-rose-700">{warning}</p>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
                >
                  {t("attendance.viewMap")} →
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
