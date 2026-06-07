"use client";

import { AttendanceReport } from "@/components/AttendanceReport";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { BranchSettings, Staff, TimeLog } from "@/lib/types";

interface AttendancePageViewProps {
  staff: Staff[];
  timeLogs: TimeLog[];
  branchSettings: BranchSettings | null;
}

export function AttendancePageView({
  staff,
  timeLogs,
  branchSettings,
}: AttendancePageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("attendance.title")} description={t("attendance.description")} />
      <AttendanceReport
        staff={staff}
        timeLogs={timeLogs}
        branchSettings={branchSettings}
      />
    </div>
  );
}
