"use client";

import { ShiftSwapPanel } from "@/components/ShiftSwapPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { Shift, ShiftSwapRequest, Staff } from "@/lib/types";

interface SwapsPageViewProps {
  staff: Staff[];
  shifts: Shift[];
  requests: ShiftSwapRequest[];
}

export function SwapsPageView({ staff, shifts, requests }: SwapsPageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("swaps.title")} description={t("swaps.description")} />
      <ShiftSwapPanel staff={staff} shifts={shifts} requests={requests} />
    </div>
  );
}
