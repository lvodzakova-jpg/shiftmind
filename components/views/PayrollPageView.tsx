"use client";

import { PayrollPanel } from "@/components/PayrollPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { Employee, LeaveRequest, Shift, TimeLog } from "@/lib/types";

interface PayrollPageViewProps {
  staff: Employee[];
  shifts: Shift[];
  timeLogs: TimeLog[];
  leaveRequests: LeaveRequest[];
  mealAllowance: number;
  branchName?: string;
}

export function PayrollPageView(props: PayrollPageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("payroll.title")} description={t("payroll.description")} />
      <PayrollPanel {...props} />
    </div>
  );
}
