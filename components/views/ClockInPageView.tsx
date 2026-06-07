"use client";

import { ClockInPanel } from "@/components/ClockInPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { BranchSettings, Shift, Staff, TimeLog } from "@/lib/types";
import Link from "next/link";

interface ClockInPageViewProps {
  staff: Staff[];
  todayShifts: Shift[];
  timeLogs: TimeLog[];
  branchSettings?: BranchSettings | null;
}

export function ClockInPageView({
  staff,
  todayShifts,
  timeLogs,
  branchSettings,
}: ClockInPageViewProps) {
  const { t } = useTranslation();

  if (staff.length === 0) {
    return (
      <div>
        <PageHeader title={t("clockin.title")} description={t("clockin.description")} />
        <div className="rounded-2xl border border-dashed border-default bg-surface p-12 text-center text-muted">
          {t("schedule.noStaff")}{" "}
          <Link href="/staff" className="font-medium text-brand hover:underline">
            {t("schedule.addStaff")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("clockin.title")} description={t("clockin.description")} />
      <ClockInPanel
        staff={staff}
        todayShifts={todayShifts}
        timeLogs={timeLogs}
        branchSettings={branchSettings}
      />
    </div>
  );
}
