"use client";

import { LeavesPanel } from "@/components/LeavesPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { LeaveBalance, LeaveRequest, Staff } from "@/lib/types";

interface LeavesPageViewProps {
  staff: Staff[];
  requests: LeaveRequest[];
  balances: LeaveBalance[];
}

export function LeavesPageView({ staff, requests, balances }: LeavesPageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("leaves.title")} description={t("leaves.description")} />
      <LeavesPanel staff={staff} requests={requests} balances={balances} />
    </div>
  );
}
